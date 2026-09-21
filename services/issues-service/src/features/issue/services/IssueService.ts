import {
  requirePermission,
  type IAuthorizationClient,
} from "@pine/authorization";
import { IssueStatus, ITEM_PRIORITY, ServiceResponse } from "@pine/common";
import { createCloudEvent, IssueCreatedEvent, IssueUpdatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { DbClient, Issue } from "@/db";
import { IssueNotFoundError } from "@/features/issue/errors";
import type { IIssueAssigneeRepository, IIssueRepository } from "@/features/issue/repositories";
import type {
  CreateIssueOptions,
  DeleteIssueOptions,
  FindIssueOptions,
  FindProjectIssuesOptions,
  FindSubIssuesOptions,
  IIssueService,
  UpdateIssueOptions,
} from "./IIssueService";

export type IssueDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

@injectable()
export class IssueService implements IIssueService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: IssueDatabase,
    @inject(TYPES.IssueRepository)
    private readonly issueRepository: IIssueRepository,
    @inject(TYPES.IssueAssigneeRepository)
    private readonly issueAssigneeRepository: IIssueAssigneeRepository,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async createIssue(options: CreateIssueOptions) {
    const {
      userId,
      assigneeIds,
      parentIssueId,
      estimate,
      component,
      statusId,
      priority,
      ...input
    } = options;

    return this.db.transaction(async (tx) => {
      if (parentIssueId) {
        const parentIssue = await this.issueRepository.findById(parentIssueId, { tx });
        if (!parentIssue) {
          throw new Error("Parent not found");
        }
      }

      const issue = await this.issueRepository.save(
        {
          ...input,
          statusId: statusId ?? "",
          priority: priority ?? ITEM_PRIORITY.NORMAL,
          estimate,
          component,
          createdById: userId,
          parentIssueId: parentIssueId ?? null,
        },
        { tx },
      );

      if (assigneeIds.length > 0) {
        await this.issueAssigneeRepository.saveMany(
          assigneeIds.map((assigneeId) => ({
            issueId: issue.id,
            userId: assigneeId,
          })),
          { tx },
        );
      }

      const event = createCloudEvent({
        type: IssueCreatedEvent.type,
        version: IssueCreatedEvent.version,
        schema: IssueCreatedEvent.schema,
        source: "pine/issues-service",
        subject: issue.id,
        data: this.toIssueCreatedEventData(issue),
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: IssueCreatedEvent.version,
          aggregateType: "issue",
          aggregateId: issue.id,
          payload: event,
        },
        { tx },
      );

      return issue.id;
    });
  }

  async findProjectIssues(options: FindProjectIssuesOptions) {
    const { projectId, userId } = options;
    return this.issueRepository.findRootsByProject(projectId, userId);
  }

  async findSubIssues(options: FindSubIssuesOptions) {
    const { userId, parentIssueId } = options;

    const parentIssue = await this.issueRepository.findById(parentIssueId);
    if (!parentIssue || parentIssue.createdById !== userId) {
      throw new Error("Parent not found");
    }

    return this.issueRepository.findChildren(parentIssueId, userId);
  }

  async findIssue(options: FindIssueOptions) {
    const { userId, issueId } = options;
    return this.issueRepository.findByIdForUser(issueId, userId);
  }

  getIssueStatusList = async () => {
    const statues = this.getStatuses();
    return new ServiceResponse({ rows: statues, rowCount: statues.length });
  };

  getIssuePriorityList = async () => {
    const priority = this.getPriorities();
    return new ServiceResponse({ rows: priority, rowCount: priority.length });
  };

  async getIssue(issueId: string) {
    return this.issueRepository.findById(issueId);
  }

  async updateIssue(options: UpdateIssueOptions) {
    const {
      issueId,
      name,
      description,
      dueDate,
      userId,
      priority,
      statusId,
      estimate,
      component,
      type,
    } = options;

    await this.db.transaction(async (tx) => {
      const updatedIssue = await this.issueRepository.update(
        issueId,
        userId,
        {
          name,
          description,
          dueDate,
          statusId,
          priority,
          estimate,
          component,
          type,
          updatedById: userId,
        },
        { tx },
      );

      const event = createCloudEvent({
        type: IssueUpdatedEvent.type,
        version: IssueUpdatedEvent.version,
        schema: IssueUpdatedEvent.schema,
        source: "pine/issues-service",
        subject: updatedIssue.id,
        data: this.toIssueUpdatedEventData(updatedIssue),
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: IssueUpdatedEvent.version,
          aggregateType: "issue",
          aggregateId: updatedIssue.id,
          payload: event,
        },
        { tx },
      );
    });
  }

  async deleteIssue(options: DeleteIssueOptions) {
    const { id, userId } = options;

    const issue = await this.issueRepository.findById(id);
    if (!issue) {
      throw new IssueNotFoundError(`Issue not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      userId,
      "delete",
      `project:${issue.projectId}`,
    );

    const deleted = await this.issueRepository.softDelete(id);
    if (!deleted) {
      throw new IssueNotFoundError(`Issue not found: ${id}`);
    }
  }

  private getStatuses() {
    return Object.values(IssueStatus);
  }

  private getPriorities() {
    return Object.values(ITEM_PRIORITY);
  }

  private toIssueCreatedEventData(issue: Issue) {
    return {
      id: issue.id,
      name: issue.name,
      ownerId: issue.createdById,
      reporterId: issue.createdById,
      projectId: issue.projectId,
      createdAt: issue.createdAt.toISOString(),
      ...(issue.description != null ? { description: issue.description } : {}),
    };
  }

  private toIssueUpdatedEventData(issue: Issue) {
    return {
      id: issue.id,
      name: issue.name,
      ownerId: issue.createdById,
      reporterId: issue.createdById,
      projectId: issue.projectId,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: (issue.updatedAt ?? issue.createdAt).toISOString(),
      updatedById: issue.updatedById ?? issue.createdById,
      ...(issue.description != null ? { description: issue.description } : {}),
      ...(issue.statusId ? { statusId: issue.statusId } : {}),
      ...(issue.priority ? { priority: issue.priority } : {}),
      ...(issue.type ? { type: issue.type } : {}),
      ...(issue.dueDate != null ? { dueDate: issue.dueDate.toISOString() } : {}),
      ...(issue.estimate != null ? { estimate: issue.estimate } : {}),
      ...(issue.component != null ? { component: issue.component } : {}),
    };
  }
}
