import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import {
  CloudEvent,
  createCloudEvent,
  OrganizationCreatedEvent,
  OrganizationDeletedEvent,
  OrganizationMemberCreatedEvent,
  OrganizationUpdatedEvent,
  type OrganizationCreatedData,
  type OrganizationDeletedData,
  type OrganizationMemberCreatedData,
  type OrganizationUpdatedData,
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
import {
  InvalidParentOrganizationTypeError,
  OrganizationTypeNotFoundError,
} from "@/features/organization-types/errors";
import type { IOrganizationTypeRepository } from "@/features/organization-types/repositories";
import {
  OrganizationMemberRole,
  type IOrganizationMemberRepository,
} from "@/features/organization-members";
import { TenantNotFoundError } from "@/features/tenants/errors";
import type { ITenantRepository } from "@/features/tenants/repositories";

@injectable()
export class OrganizationService implements IOrganizationService {
  constructor(
    @inject(TYPES.OrganizationRepository)
    private readonly organizationRepository: IOrganizationRepository,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.OrganizationTypeRepository)
    private readonly organizationTypeRepository: IOrganizationTypeRepository,
    @inject(TYPES.OrganizationMemberRepository)
    private readonly organizationMemberRepository: IOrganizationMemberRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async createOrganization(input: CreateOrganizationInput, actorId: string): Promise<Organization> {
    await requirePermission(
      this.authorizationClient,
      actorId,
      "create_organization",
      `Tenant:${input.tenantId}`,
    );

    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${input.tenantId}`);
    }

    const organizationType = await this.organizationTypeRepository.findById(
      input.organizationTypeId,
    );
    if (!organizationType) {
      throw new OrganizationTypeNotFoundError(
        `Organization type not found in tenant: ${input.organizationTypeId}`,
      );
    }
    if (organizationType.tenantId !== input.tenantId) {
      throw new OrganizationTypeNotFoundError(
        `Organization type not found in tenant: ${input.organizationTypeId}`,
      );
    }

    const parentOrganizationId = input.parentOrganizationId ?? null;
    if (!parentOrganizationId && organizationType.parentOrganizationTypeId) {
      throw new InvalidParentOrganizationError(
        `Organization type requires a parent organization: ${input.organizationTypeId}`,
      );
    }

    if (parentOrganizationId) {
      const parent = await this.organizationRepository.findById(parentOrganizationId);
      if (!parent) {
        throw new InvalidParentOrganizationError(
          `Parent organization not found in tenant: ${parentOrganizationId}`,
        );
      }
      if (parent.tenantId !== input.tenantId) {
        throw new InvalidParentOrganizationError(
          `Parent organization not found in tenant: ${parentOrganizationId}`,
        );
      }
      if (parent.organizationTypeId !== organizationType.parentOrganizationTypeId) {
        throw new InvalidParentOrganizationTypeError(
          `Parent organization type does not match organization type: ${input.organizationTypeId}`,
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
          organizationTypeId: input.organizationTypeId,
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
          organizationTypeId: organization.organizationTypeId,
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

      const ownerMember = await this.organizationMemberRepository.saveOrganizationMember(
        {
          organizationId: organization.id,
          identityId: actorId,
          role: OrganizationMemberRole.OWNER,
        },
        { tx },
      );

      const memberCreated: CloudEvent<OrganizationMemberCreatedData> = createCloudEvent({
        type: OrganizationMemberCreatedEvent.type,
        version: OrganizationMemberCreatedEvent.version,
        schema: OrganizationMemberCreatedEvent.schema,
        source: "pine/platform-service",
        subject: ownerMember.id,
        data: {
          id: ownerMember.id,
          organizationId: organization.id,
          identityId: actorId,
          role: OrganizationMemberRole.OWNER,
          createdAt: ownerMember.createdAt.toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: memberCreated.id,
          eventType: memberCreated.type,
          eventVersion: OrganizationMemberCreatedEvent.version,
          aggregateType: "organization-member",
          aggregateId: organization.id,
          payload: memberCreated,
        },
        { tx },
      );

      return organization;
    });
  }

  async getOrganizationById(id: string, actorId: string): Promise<Organization> {
    await requirePermission(this.authorizationClient, actorId, "read", `Organization:${id}`);

    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new OrganizationNotFoundError(`Organization not found: ${id}`);
    }

    return organization;
  }

  async listOrganizations(input: ListOrganizationsInput, actorId: string): Promise<Organization[]> {
    await requirePermission(
      this.authorizationClient,
      actorId,
      "read_list",
      `Tenant:${input.tenantId}`,
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

  async listMyOrganizations(actorId: string): Promise<OrganizationNode[]> {
    const relationships = await this.authorizationClient.listRelationships({
      namespace: "Organization",
      subject: { namespace: "Identity", id: actorId },
    });

    const organizationIds = Array.from(
      new Set(relationships.map((rel) => rel.object.id).filter((id) => id.length > 0)),
    );

    if (organizationIds.length === 0) return [];

    const organizations = await this.organizationRepository.findByIds(organizationIds);
    return buildOrganizationForest(organizations);
  }

  async updateOrganization(
    id: string,
    input: UpdateOrganizationInput,
    actorId: string,
  ): Promise<Organization> {
    await requirePermission(this.authorizationClient, actorId, "update", `Organization:${id}`);

    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new OrganizationNotFoundError(`Organization not found: ${id}`);
    }

    if (input.parentOrganizationId !== undefined) {
      await this.assertValidParentOrganization(organization, input.parentOrganizationId);
    }

    const previousParentOrganizationId = organization.parentOrganizationId;
    const parentChanged =
      input.parentOrganizationId !== undefined &&
      (input.parentOrganizationId ?? null) !== (previousParentOrganizationId ?? null);

    return this.db.transaction(async (tx) => {
      const updated = await this.organizationRepository.update(
        id,
        {
          parentOrganizationId: input.parentOrganizationId,
        },
        { tx },
      );
      if (!updated) {
        throw new OrganizationNotFoundError(`Organization not found: ${id}`);
      }

      if (parentChanged) {
        const updatedEvent: CloudEvent<OrganizationUpdatedData> = createCloudEvent({
          type: OrganizationUpdatedEvent.type,
          version: OrganizationUpdatedEvent.version,
          schema: OrganizationUpdatedEvent.schema,
          source: "pine/platform-service",
          subject: updated.id,
          data: {
            id: updated.id,
            tenantId: updated.tenantId,
            updatedAt: (updated.updatedAt ?? new Date()).toISOString(),
            ...(previousParentOrganizationId != null ? { previousParentOrganizationId } : {}),
            ...(updated.parentOrganizationId != null
              ? { parentOrganizationId: updated.parentOrganizationId }
              : {}),
          },
        });

        await this.outboxService.schedule(
          {
            eventId: updatedEvent.id,
            eventType: updatedEvent.type,
            eventVersion: OrganizationUpdatedEvent.version,
            aggregateType: "organization",
            aggregateId: updated.id,
            payload: updatedEvent,
          },
          { tx },
        );
      }

      return updated;
    });
  }

  async deleteOrganization(id: string, actorId: string): Promise<void> {
    await requirePermission(this.authorizationClient, actorId, "delete", `Organization:${id}`);

    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new OrganizationNotFoundError(`Organization not found: ${id}`);
    }

    await this.db.transaction(async (tx) => {
      const deleted = await this.organizationRepository.softDelete(id, { tx });
      if (!deleted) {
        throw new OrganizationNotFoundError(`Organization not found: ${id}`);
      }

      const deletedEvent: CloudEvent<OrganizationDeletedData> = createCloudEvent({
        type: OrganizationDeletedEvent.type,
        version: OrganizationDeletedEvent.version,
        schema: OrganizationDeletedEvent.schema,
        source: "pine/platform-service",
        subject: organization.id,
        data: {
          id: organization.id,
          tenantId: organization.tenantId,
          deletedAt: new Date().toISOString(),
          ...(organization.parentOrganizationId != null
            ? { parentOrganizationId: organization.parentOrganizationId }
            : {}),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: deletedEvent.id,
          eventType: deletedEvent.type,
          eventVersion: OrganizationDeletedEvent.version,
          aggregateType: "organization",
          aggregateId: organization.id,
          payload: deletedEvent,
        },
        { tx },
      );
    });
  }

  private async assertValidParentOrganization(
    organization: Organization,
    parentOrganizationId: string | null,
  ): Promise<void> {
    const organizationType = await this.organizationTypeRepository.findById(
      organization.organizationTypeId,
    );
    if (!organizationType || organizationType.tenantId !== organization.tenantId) {
      throw new OrganizationTypeNotFoundError(
        `Organization type not found in tenant: ${organization.organizationTypeId}`,
      );
    }

    if (!parentOrganizationId) {
      if (organizationType.parentOrganizationTypeId) {
        throw new InvalidParentOrganizationError(
          `Organization type requires a parent organization: ${organization.organizationTypeId}`,
        );
      }
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

    if (parent.organizationTypeId !== organizationType.parentOrganizationTypeId) {
      throw new InvalidParentOrganizationTypeError(
        `Parent organization type does not match organization type: ${organization.organizationTypeId}`,
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
