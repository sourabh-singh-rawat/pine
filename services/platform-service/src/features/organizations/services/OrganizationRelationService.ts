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
  OrganizationRelationCreatedEvent,
  type OrganizationRelationCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import {
  InvalidOrganizationRelationError,
  OrganizationRelationNotFoundError,
} from "@/features/organizations/errors";
import type {
  CreateOrganizationRelationInput,
  CreateOrganizationRelationOptions,
  IOrganizationRelationService,
  ListOrganizationRelationsInput,
  OrganizationRelation,
} from "@/features/organizations/services/IOrganizationRelationService";

const organizationRelations = new Set([OWNER, ADMIN, MEMBER]);

const assertOrganizationRelation = (relation: string) => {
  if (!organizationRelations.has(relation)) {
    throw new InvalidOrganizationRelationError(`Invalid organization relation: ${relation}`);
  }
};

@injectable()
export class OrganizationRelationService implements IOrganizationRelationService {
  constructor(
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async create(
    input: CreateOrganizationRelationInput,
    identityId: string,
    options?: CreateOrganizationRelationOptions,
  ): Promise<OrganizationRelation> {
    if (!options?.skipAuthorization) {
      await requirePermission(
        this.authorizationClient,
        identityId,
        "manage_members",
        `organization:${input.organizationId}`,
      );
    }

    assertOrganizationRelation(input.relation);

    const organizationRelation: OrganizationRelation = {
      id: `${input.organizationId}:${input.relation}:${input.identityId}`,
      organizationId: input.organizationId,
      identityId: input.identityId,
      relation: input.relation,
    };

    return this.db.transaction(async (tx) => {
      const event: CloudEvent<OrganizationRelationCreatedData> = createCloudEvent({
        type: OrganizationRelationCreatedEvent.type,
        version: OrganizationRelationCreatedEvent.version,
        schema: OrganizationRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: organizationRelation.id,
        data: {
          id: organizationRelation.id,
          organizationId: organizationRelation.organizationId,
          identityId: organizationRelation.identityId,
          relation: organizationRelation.relation,
          createdAt: new Date().toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: OrganizationRelationCreatedEvent.version,
          aggregateType: "organization-relation",
          aggregateId: organizationRelation.organizationId,
          payload: event,
        },
        { tx },
      );

      return organizationRelation;
    });
  }

  async getById(id: string, identityId: string): Promise<OrganizationRelation> {
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
      throw new OrganizationRelationNotFoundError(`Organization relation not found: ${id}`);
    }

    const organizationId = parts[0];
    const relation = parts[1];
    const subjectIdentityId = parts[2];

    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `organization:${organizationId}`,
    );

    assertOrganizationRelation(relation);

    const assigned = await this.assignedFor(organizationId, relation);
    const organizationRelation = assigned.find((item) => item.identityId === subjectIdentityId);
    if (!organizationRelation) {
      throw new OrganizationRelationNotFoundError(`Organization relation not found: ${id}`);
    }

    return organizationRelation;
  }

  async list(
    input: ListOrganizationRelationsInput,
    identityId: string,
  ): Promise<OrganizationRelation[]> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `organization:${input.organizationId}`,
    );

    const relations = input.relation === undefined ? [OWNER, ADMIN, MEMBER] : [input.relation];
    if (input.relation !== undefined) {
      assertOrganizationRelation(input.relation);
    }

    const organizationRelationsList: OrganizationRelation[] = [];
    for (const relation of relations) {
      const assigned = await this.assignedFor(input.organizationId, relation);
      for (const organizationRelation of assigned) {
        if (
          input.identityId !== undefined &&
          organizationRelation.identityId !== input.identityId
        ) {
          continue;
        }
        organizationRelationsList.push(organizationRelation);
      }
    }

    return organizationRelationsList;
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
      throw new OrganizationRelationNotFoundError(`Organization relation not found: ${id}`);
    }

    const organizationId = parts[0];
    const relation = parts[1];
    const subjectIdentityId = parts[2];

    await requirePermission(
      this.authorizationClient,
      identityId,
      "manage_members",
      `organization:${organizationId}`,
    );

    assertOrganizationRelation(relation);

    await this.authorizationClient.deleteRelationship({
      object: { namespace: "organization", id: organizationId },
      relation,
      subject: { namespace: IDENTITY, id: subjectIdentityId },
    });
  }

  private assignedFor = async (
    organizationId: string,
    relation: string,
  ): Promise<OrganizationRelation[]> => {
    const relationships = await this.authorizationClient.listRelationships({
      namespace: "organization",
      object: organizationId,
      relation,
    });

    const organizationRelationsList: OrganizationRelation[] = [];
    for (const relationship of relationships) {
      if (relationship.subject === undefined) {
        continue;
      }
      organizationRelationsList.push({
        id: `${organizationId}:${relation}:${relationship.subject.id}`,
        organizationId,
        identityId: relationship.subject.id,
        relation,
      });
    }
    return organizationRelationsList;
  };
}
