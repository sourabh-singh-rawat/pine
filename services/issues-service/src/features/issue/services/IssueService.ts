import { IssueStatus, ITEM_PRIORITY, ServiceResponse } from "@pine/common";
import { createCloudEvent, IssueCreatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { DbClient, Issue } from "@/db";
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

    await this.issueRepository.update(issueId, userId, {
      name,
      description,
      dueDate,
      statusId,
      priority,
      estimate,
      component,
      type,
      updatedById: userId,
    });
  }

  async deleteIssue(options: DeleteIssueOptions) {
    await this.issueRepository.hardDelete(options.id);
  }

  private getStatuses = () => Object.values(IssueStatus);

  private getPriorities = () => Object.values(ITEM_PRIORITY);

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
}
