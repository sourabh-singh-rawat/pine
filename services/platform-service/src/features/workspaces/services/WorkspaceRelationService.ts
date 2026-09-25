import {
  ADMIN,
  IDENTITY,
  MEMBER,
  OWNER,
  requirePermission,
  type IAuthorizationClient,
} from "@pine/authorization";
import {
  CloudEvent,
  createCloudEvent,
  WorkspaceRelationCreatedEvent,
  type WorkspaceRelationCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import {
  InvalidWorkspaceRelationError,
  WorkspaceRelationNotFoundError,
} from "@/features/workspaces/errors";
import type {
  CreateWorkspaceRelationInput,
  CreateWorkspaceRelationOptions,
  IWorkspaceRelationService,
  ListWorkspaceRelationsInput,
  WorkspaceRelation,
} from "@/features/workspaces/services/IWorkspaceRelationService";

const workspaceRelations = new Set([OWNER, ADMIN, MEMBER]);

const assertWorkspaceRelation = (relation: string) => {
  if (!workspaceRelations.has(relation)) {
    throw new InvalidWorkspaceRelationError(`Invalid workspace relation: ${relation}`);
  }
};

@injectable()
export class WorkspaceRelationService implements IWorkspaceRelationService {
  constructor(
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async create(
    input: CreateWorkspaceRelationInput,
    identityId: string,
    options?: CreateWorkspaceRelationOptions,
  ): Promise<WorkspaceRelation> {
    if (!options?.skipAuthorization) {
      await requirePermission(
        this.authorizationClient,
        identityId,
        "manage_members",
        `workspace:${input.workspaceId}`,
      );
    }

    assertWorkspaceRelation(input.relation);

    const workspaceRelation: WorkspaceRelation = {
      id: `${input.workspaceId}:${input.relation}:${input.identityId}`,
      workspaceId: input.workspaceId,
      identityId: input.identityId,
      relation: input.relation,
    };

    return this.db.transaction(async (tx) => {
      const event: CloudEvent<WorkspaceRelationCreatedData> = createCloudEvent({
        type: WorkspaceRelationCreatedEvent.type,
        version: WorkspaceRelationCreatedEvent.version,
        schema: WorkspaceRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: workspaceRelation.id,
        data: {
          id: workspaceRelation.id,
          workspaceId: workspaceRelation.workspaceId,
          identityId: workspaceRelation.identityId,
          relation: workspaceRelation.relation,
          createdAt: new Date().toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: WorkspaceRelationCreatedEvent.version,
          aggregateType: "workspace-relation",
          aggregateId: workspaceRelation.workspaceId,
          payload: event,
        },
        { tx },
      );

      return workspaceRelation;
    });
  }

  async getById(id: string, identityId: string): Promise<WorkspaceRelation> {
    const parts = id.split(":");
    if (
      parts.length !== 3 ||
      parts[0] === undefined ||
      parts[1] === undefined ||
      parts[2] === undefined ||
      parts[0].length === 0 ||
      parts[1].length === 0 ||
      parts[2].length === 0
    ) {
      throw new WorkspaceRelationNotFoundError(`Workspace relation not found: ${id}`);
    }

    const workspaceId = parts[0];
    const relation = parts[1];
    const subjectIdentityId = parts[2];

    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `workspace:${workspaceId}`,
    );

    assertWorkspaceRelation(relation);

    const assigned = await this.assignedFor(workspaceId, relation);
    const workspaceRelation = assigned.find((item) => item.identityId === subjectIdentityId);
    if (!workspaceRelation) {
      throw new WorkspaceRelationNotFoundError(`Workspace relation not found: ${id}`);
    }

    return workspaceRelation;
  }

  async list(input: ListWorkspaceRelationsInput, identityId: string): Promise<WorkspaceRelation[]> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `workspace:${input.workspaceId}`,
    );

    const relations = input.relation === undefined ? [OWNER, ADMIN, MEMBER] : [input.relation];
    if (input.relation !== undefined) {
      assertWorkspaceRelation(input.relation);
    }

    const workspaceRelationsList: WorkspaceRelation[] = [];
    for (const relation of relations) {
      const assigned = await this.assignedFor(input.workspaceId, relation);
      for (const workspaceRelation of assigned) {
        if (input.identityId !== undefined && workspaceRelation.identityId !== input.identityId) {
          continue;
        }
        workspaceRelationsList.push(workspaceRelation);
      }
    }

    return workspaceRelationsList;
  }

  async delete(id: string, identityId: string): Promise<void> {
    const parts = id.split(":");
    if (
      parts.length !== 3 ||
      parts[0] === undefined ||
      parts[1] === undefined ||
      parts[2] === undefined ||
      parts[0].length === 0 ||
      parts[1].length === 0 ||
      parts[2].length === 0
    ) {
      throw new WorkspaceRelationNotFoundError(`Workspace relation not found: ${id}`);
    }

    const workspaceId = parts[0];
    const relation = parts[1];
    const subjectIdentityId = parts[2];

    await requirePermission(
      this.authorizationClient,
      identityId,
      "manage_members",
      `workspace:${workspaceId}`,
    );

    assertWorkspaceRelation(relation);

    await this.authorizationClient.deleteRelationship({
      object: { namespace: "workspace", id: workspaceId },
      relation,
      subject: { namespace: IDENTITY, id: subjectIdentityId },
    });
  }

  private assignedFor = async (
    workspaceId: string,
    relation: string,
  ): Promise<WorkspaceRelation[]> => {
    const relationships = await this.authorizationClient.listRelationships({
      namespace: "workspace",
      object: workspaceId,
      relation,
    });

    const workspaceRelationsList: WorkspaceRelation[] = [];
    for (const relationship of relationships) {
      if (relationship.subject === undefined) {
        continue;
      }
      workspaceRelationsList.push({
        id: `${workspaceId}:${relation}:${relationship.subject.id}`,
        workspaceId,
        identityId: relationship.subject.id,
        relation,
      });
    }
    return workspaceRelationsList;
  };
}
