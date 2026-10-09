import { OWNER, requirePermission, type IAuthorizationClient } from "@pine/authorization";
import {
  CloudEvent,
  createCloudEvent,
  OrganizationCreatedEvent,
  OrganizationRelationCreatedEvent,
  type OrganizationCreatedData,
  type OrganizationRelationCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, Organization } from "@/db";
import {
  InvalidParentOrganizationError,
  OrganizationNameConflictError,
  OrganizationNotFoundError,
  OrganizationSlugConflictError,
} from "@/features/organizations/errors";
import type { IOrganizationRepository } from "@/features/organizations/repositories";
import type {
  CreateOrganizationInput,
  IOrganizationService,
  ListOrganizationsInput,
  UpdateOrganizationInput,
} from "@/features/organizations/services/IOrganizationService";
import { buildOrganizationForest, type OrganizationNode } from "@/features/organizations/utils";
import { TenantNotFoundError } from "@/features/tenants/errors";
import type { ITenantRepository } from "@/features/tenants/repositories";

@injectable()
export class OrganizationService implements IOrganizationService {
  constructor(
    @inject(TYPES.OrganizationRepository)
    private readonly organizationRepository: IOrganizationRepository,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async create(input: CreateOrganizationInput, identityId: string): Promise<Organization> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_organization",
      `tenant:${input.tenantId}`,
    );

    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${input.tenantId}`);
    }

    if (input.parentOrganizationId) {
      const parent = await this.organizationRepository.findById(input.parentOrganizationId);
      if (!parent || parent.tenantId !== input.tenantId) {
        throw new InvalidParentOrganizationError(
          `Parent organization not found in tenant: ${input.parentOrganizationId}`,
        );
      }
    }

    const slugExists = await this.organizationRepository.existsBySlugInTenant(
      input.tenantId,
      input.slug,
    );
    if (slugExists) {
      throw new OrganizationSlugConflictError(
        `Organization slug already exists in tenant: ${input.slug}`,
      );
    }

    const nameExists = await this.organizationRepository.existsByNameInTenant(
      input.tenantId,
      input.name,
    );
    if (nameExists) {
      throw new OrganizationNameConflictError(
        `Organization name already exists in tenant: ${input.name}`,
      );
    }

    return this.db.transaction(async (tx) => {
      const organization = await this.organizationRepository.save(
        {
          tenantId: input.tenantId,
          parentOrganizationId: input.parentOrganizationId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          isActive: input.isActive,
        },
        { tx },
      );

      const created: CloudEvent<OrganizationCreatedData> = createCloudEvent({
        type: OrganizationCreatedEvent.type,
        version: OrganizationCreatedEvent.version,
        schema: OrganizationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: organization.id,
        data: {
          id: organization.id,
          tenantId: organization.tenantId,
          name: organization.name,
          slug: organization.slug,
          isActive: organization.isActive,
          version: organization.version,
          createdAt: organization.createdAt.toISOString(),
          ...(organization.description != null ? { description: organization.description } : {}),
          ...(organization.parentOrganizationId != null
            ? { parentOrganizationId: organization.parentOrganizationId }
            : {}),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: created.id,
          eventType: created.type,
          eventVersion: OrganizationCreatedEvent.version,
          aggregateType: "organization",
          aggregateId: organization.id,
          payload: created,
        },
        { tx },
      );

      const ownerRelationId = `${organization.id}:${OWNER}:${identityId}`;
      const ownerRelation: CloudEvent<OrganizationRelationCreatedData> = createCloudEvent({
        type: OrganizationRelationCreatedEvent.type,
        version: OrganizationRelationCreatedEvent.version,
        schema: OrganizationRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: ownerRelationId,
        data: {
          id: ownerRelationId,
          organizationId: organization.id,
          identityId,
          relation: OWNER,
          createdAt: new Date().toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: ownerRelation.id,
          eventType: ownerRelation.type,
          eventVersion: OrganizationRelationCreatedEvent.version,
          aggregateType: "organization-relation",
          aggregateId: organization.id,
          payload: ownerRelation,
        },
        { tx },
      );

      return organization;
    });
  }

  async getById(id: string, identityId: string): Promise<Organization> {
    await requirePermission(this.authorizationClient, identityId, "read", `organization:${id}`);

    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new OrganizationNotFoundError(`Organization not found: ${id}`);
    }

    return organization;
  }

  async list(input: ListOrganizationsInput, identityId: string): Promise<Organization[]> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read_list",
      `tenant:${input.tenantId}`,
    );

    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${input.tenantId}`);
    }

    return this.organizationRepository.findMany({
      tenantId: input.tenantId,
      parentOrganizationId: input.parentOrganizationId,
    });
  }

  async listMyOrganizations(identityId: string): Promise<OrganizationNode[]> {
    const relationships = await this.authorizationClient.listRelationships({
      namespace: "organization",
      subject: { namespace: "identity", id: identityId },
    });

    const organizationIds = Array.from(
      new Set(relationships.map((rel) => rel.object.id).filter((id) => id.length > 0)),
    );

    if (organizationIds.length === 0) return [];

    const organizations = await this.organizationRepository.findByIds(organizationIds);
    return buildOrganizationForest(organizations);
  }

  async update(
    id: string,
    input: UpdateOrganizationInput,
    identityId: string,
  ): Promise<Organization> {
    await requirePermission(this.authorizationClient, identityId, "update", `organization:${id}`);

    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new OrganizationNotFoundError(`Organization not found: ${id}`);
    }

    if (input.parentOrganizationId !== undefined) {
      await this.assertValidParentOrganization(organization, input.parentOrganizationId);
    }

    const updated = await this.organizationRepository.update(id, {
      parentOrganizationId: input.parentOrganizationId,
    });
    if (!updated) {
      throw new OrganizationNotFoundError(`Organization not found: ${id}`);
    }

    return updated;
  }

  async delete(id: string, identityId: string): Promise<void> {
    await requirePermission(this.authorizationClient, identityId, "delete", `organization:${id}`);

    const deleted = await this.organizationRepository.softDelete(id);
    if (!deleted) {
      throw new OrganizationNotFoundError(`Organization not found: ${id}`);
    }
  }

  private async assertValidParentOrganization(
    organization: Organization,
    parentOrganizationId: string | null,
  ): Promise<void> {
    if (!parentOrganizationId) {
      return;
    }

    if (parentOrganizationId === organization.id) {
      throw new InvalidParentOrganizationError(
        `Organization cannot be its own parent: ${organization.id}`,
      );
    }

    const parent = await this.organizationRepository.findById(parentOrganizationId);
    if (!parent || parent.tenantId !== organization.tenantId) {
      throw new InvalidParentOrganizationError(
        `Parent organization not found in tenant: ${parentOrganizationId}`,
      );
    }

    let ancestorId = parent.parentOrganizationId;
    const seen = new Set<string>([parent.id]);
    while (ancestorId) {
      if (ancestorId === organization.id) {
        throw new InvalidParentOrganizationError(
          `Parent organization would create a cycle: ${parentOrganizationId}`,
        );
      }
      if (seen.has(ancestorId)) {
        break;
      }
      seen.add(ancestorId);
      const ancestor = await this.organizationRepository.findById(ancestorId);
      if (!ancestor) {
        break;
      }
      ancestorId = ancestor.parentOrganizationId;
    }
  }
}
