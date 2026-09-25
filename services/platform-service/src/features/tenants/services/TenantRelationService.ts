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
  TenantRelationCreatedEvent,
  type TenantRelationCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import { InvalidTenantRelationError, TenantRelationNotFoundError } from "@/features/tenants/errors";
import type {
  CreateTenantRelationInput,
  CreateTenantRelationOptions,
  ITenantRelationService,
  ListTenantRelationsInput,
  TenantRelation,
} from "@/features/tenants/services/ITenantRelationService";

const tenantRelations = new Set([OWNER, ADMIN, MEMBER]);

const assertTenantRelation = (relation: string) => {
  if (!tenantRelations.has(relation)) {
    throw new InvalidTenantRelationError(`Invalid tenant relation: ${relation}`);
  }
};

@injectable()
export class TenantRelationService implements ITenantRelationService {
  constructor(
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async create(
    input: CreateTenantRelationInput,
    identityId: string,
    options?: CreateTenantRelationOptions,
  ): Promise<TenantRelation> {
    if (!options?.skipAuthorization) {
      await requirePermission(
        this.authorizationClient,
        identityId,
        "assign_admin",
        `tenant:${input.tenantId}`,
      );
    }

    assertTenantRelation(input.relation);

    const tenantRelation: TenantRelation = {
      id: `${input.tenantId}:${input.relation}:${input.identityId}`,
      tenantId: input.tenantId,
      identityId: input.identityId,
      relation: input.relation,
    };

    return this.db.transaction(async (tx) => {
      const event: CloudEvent<TenantRelationCreatedData> = createCloudEvent({
        type: TenantRelationCreatedEvent.type,
        version: TenantRelationCreatedEvent.version,
        schema: TenantRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: tenantRelation.id,
        data: {
          id: tenantRelation.id,
          tenantId: tenantRelation.tenantId,
          identityId: tenantRelation.identityId,
          relation: tenantRelation.relation,
          createdAt: new Date().toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: TenantRelationCreatedEvent.version,
          aggregateType: "tenant-relation",
          aggregateId: tenantRelation.tenantId,
          payload: event,
        },
        { tx },
      );

      return tenantRelation;
    });
  }

  async getById(id: string, identityId: string): Promise<TenantRelation> {
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
      throw new TenantRelationNotFoundError(`Tenant relation not found: ${id}`);
    }

    const tenantId = parts[0];
    const relation = parts[1];
    const subjectIdentityId = parts[2];

    await requirePermission(this.authorizationClient, identityId, "read", `tenant:${tenantId}`);

    assertTenantRelation(relation);

    const assigned = await this.assignedFor(tenantId, relation);
    const tenantRelation = assigned.find((item) => item.identityId === subjectIdentityId);
    if (!tenantRelation) {
      throw new TenantRelationNotFoundError(`Tenant relation not found: ${id}`);
    }

    return tenantRelation;
  }

  async list(input: ListTenantRelationsInput, identityId: string): Promise<TenantRelation[]> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `tenant:${input.tenantId}`,
    );

    const relations = input.relation === undefined ? [OWNER, ADMIN, MEMBER] : [input.relation];
    if (input.relation !== undefined) {
      assertTenantRelation(input.relation);
    }

    const tenantRelationsList: TenantRelation[] = [];
    for (const relation of relations) {
      const assigned = await this.assignedFor(input.tenantId, relation);
      for (const tenantRelation of assigned) {
        if (input.identityId !== undefined && tenantRelation.identityId !== input.identityId) {
          continue;
        }
        tenantRelationsList.push(tenantRelation);
      }
    }

    return tenantRelationsList;
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
      throw new TenantRelationNotFoundError(`Tenant relation not found: ${id}`);
    }

    const tenantId = parts[0];
    const relation = parts[1];
    const subjectIdentityId = parts[2];

    await requirePermission(
      this.authorizationClient,
      identityId,
      "assign_admin",
      `tenant:${tenantId}`,
    );

    assertTenantRelation(relation);

    await this.authorizationClient.deleteRelationship({
      object: { namespace: "tenant", id: tenantId },
      relation,
      subject: { namespace: IDENTITY, id: subjectIdentityId },
    });
  }

  private assignedFor = async (tenantId: string, relation: string): Promise<TenantRelation[]> => {
    const relationships = await this.authorizationClient.listRelationships({
      namespace: "tenant",
      object: tenantId,
      relation,
    });

    const tenantRelationsList: TenantRelation[] = [];
    for (const relationship of relationships) {
      if (relationship.subject === undefined) {
        continue;
      }
      tenantRelationsList.push({
        id: `${tenantId}:${relation}:${relationship.subject.id}`,
        tenantId,
        identityId: relationship.subject.id,
        relation,
      });
    }
    return tenantRelationsList;
  };
}
