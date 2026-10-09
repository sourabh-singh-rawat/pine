import {
  ADMIN,
  IDENTITY,
  MEMBER,
  PLATFORM_OBJECT_ID,
  requirePermission,
  type IAuthorizationClient,
} from "@pine/authorization";
import {
  CloudEvent,
  createCloudEvent,
  PlatformRelationCreatedEvent,
  type PlatformRelationCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import {
  InvalidPlatformRelationError,
  PlatformRelationNotFoundError,
} from "@/features/platform/errors";
import type {
  CreatePlatformRelationInput,
  CreatePlatformRelationOptions,
  IPlatformRelationService,
  ListPlatformRelationsInput,
  PlatformRelation,
} from "@/features/platform/services/IPlatformRelationService";

@injectable()
export class PlatformRelationService implements IPlatformRelationService {
  constructor(
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async create(
    input: CreatePlatformRelationInput,
    identityId: string,
    options?: CreatePlatformRelationOptions,
  ) {
    if (!options?.skipAuthorization) {
      await requirePermission(
        this.authorizationClient,
        identityId,
        "manage_admins",
        `Platform:${PLATFORM_OBJECT_ID}`,
      );
    }

    if (input.relation !== ADMIN && input.relation !== MEMBER) {
      throw new InvalidPlatformRelationError(`Invalid platform relation: ${input.relation}`);
    }

    const relation: PlatformRelation = {
      id: `${PLATFORM_OBJECT_ID}:${input.relation}:${input.identityId}`,
      identityId: input.identityId,
      relation: input.relation,
    };

    return this.db.transaction(async (tx) => {
      const event: CloudEvent<PlatformRelationCreatedData> = createCloudEvent({
        type: PlatformRelationCreatedEvent.type,
        version: PlatformRelationCreatedEvent.version,
        schema: PlatformRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: relation.id,
        data: {
          id: relation.id,
          identityId: relation.identityId,
          relation: relation.relation,
          createdAt: new Date().toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: PlatformRelationCreatedEvent.version,
          aggregateType: "platform-relation",
          aggregateId: PLATFORM_OBJECT_ID,
          payload: event,
        },
        { tx },
      );

      return relation;
    });
  }

  async getById(id: string, identityId: string) {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `Platform:${PLATFORM_OBJECT_ID}`,
    );

    const parts = id.split(":");
    if (
      parts.length !== 3 ||
      parts[0] !== PLATFORM_OBJECT_ID ||
      parts[1] === undefined ||
      parts[2] === undefined ||
      parts[1].length === 0 ||
      parts[2].length === 0
    ) {
      throw new PlatformRelationNotFoundError(`Platform relation not found: ${id}`);
    }

    const relation = parts[1];
    const subjectIdentityId = parts[2];
    const assigned = await this.assignedFor(relation);
    const platformRelation = assigned.find((item) => item.identityId === subjectIdentityId);
    if (!platformRelation) {
      throw new PlatformRelationNotFoundError(`Platform relation not found: ${id}`);
    }

    return platformRelation;
  }

  async list(input: ListPlatformRelationsInput, identityId: string) {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `Platform:${PLATFORM_OBJECT_ID}`,
    );

    const relations = input.relation === undefined ? [ADMIN, MEMBER] : [input.relation];
    if (input.relation !== undefined && input.relation !== ADMIN && input.relation !== MEMBER) {
      throw new InvalidPlatformRelationError(`Invalid platform relation: ${input.relation}`);
    }

    const platformRelations: PlatformRelation[] = [];
    for (const relation of relations) {
      const assigned = await this.assignedFor(relation);
      for (const platformRelation of assigned) {
        if (input.identityId !== undefined && platformRelation.identityId !== input.identityId) {
          continue;
        }
        platformRelations.push(platformRelation);
      }
    }

    return platformRelations;
  }

  async delete(id: string, identityId: string) {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "manage_admins",
      `Platform:${PLATFORM_OBJECT_ID}`,
    );

    const parts = id.split(":");
    if (
      parts.length !== 3 ||
      parts[0] !== PLATFORM_OBJECT_ID ||
      parts[1] === undefined ||
      parts[2] === undefined ||
      parts[1].length === 0 ||
      parts[2].length === 0
    ) {
      throw new PlatformRelationNotFoundError(`Platform relation not found: ${id}`);
    }

    const relation = parts[1];
    const subjectIdentityId = parts[2];
    if (relation !== ADMIN && relation !== MEMBER) {
      throw new InvalidPlatformRelationError(`Invalid platform relation: ${relation}`);
    }

    await this.authorizationClient.deleteRelationship({
      object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
      relation,
      subject: { namespace: IDENTITY, id: subjectIdentityId },
    });
  }

  private assignedFor = async (relation: string): Promise<PlatformRelation[]> => {
    const relationships = await this.authorizationClient.listRelationships({
      namespace: "Platform",
      object: PLATFORM_OBJECT_ID,
      relation,
    });

    const platformRelations: PlatformRelation[] = [];
    for (const relationship of relationships) {
      if (relationship.subject === undefined) {
        continue;
      }
      platformRelations.push({
        id: `${PLATFORM_OBJECT_ID}:${relation}:${relationship.subject.id}`,
        identityId: relationship.subject.id,
        relation,
      });
    }
    return platformRelations;
  };
}
