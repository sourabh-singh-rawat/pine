import {
  PLATFORM_OBJECT_ID,
  requirePermission,
  tenantOwnerRelationship,
  type IAuthorizationClient,
} from "@pine/authorization";
import {
  CloudEvent,
  createCloudEvent,
  TenantCreatedEvent,
  TenantDeletedEvent,
  type TenantCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, Tenant } from "@/db";
import {
  TenantNameConflictError,
  TenantNotFoundError,
  TenantSlugConflictError,
} from "@/features/tenants/errors";
import type { ITenantRepository } from "@/features/tenants/repositories";
import type { CreateTenantInput, ITenantService } from "@/features/tenants/services/ITenantService";

@injectable()
export class TenantService implements ITenantService {
  constructor(
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async createTenant(input: CreateTenantInput, identityId: string): Promise<Tenant> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_tenant",
      `platform:${PLATFORM_OBJECT_ID}`,
    );

    const slugExists = await this.tenantRepository.existsBySlug(input.slug);
    if (slugExists) {
      throw new TenantSlugConflictError(`Tenant slug already exists: ${input.slug}`);
    }

    const nameExists = await this.tenantRepository.existsByName(input.name);
    if (nameExists) {
      throw new TenantNameConflictError(`Tenant name already exists: ${input.name}`);
    }

    return this.db.transaction(async (tx) => {
      const tenant = await this.tenantRepository.save(
        {
          name: input.name,
          slug: input.slug,
          description: input.description,
          isActive: input.isActive,
        },
        { tx },
      );

      await this.authorizationClient.ensureRelationship(
        tenantOwnerRelationship(tenant.id, identityId),
      );

      const event: CloudEvent<TenantCreatedData> = createCloudEvent({
        type: TenantCreatedEvent.type,
        version: TenantCreatedEvent.version,
        schema: TenantCreatedEvent.schema,
        source: "pine/platform-service",
        subject: tenant.id,
        data: {
          id: tenant.id,
          platformId: input.platformId,
          name: tenant.name,
          slug: tenant.slug,
          isActive: tenant.isActive,
          version: tenant.version,
          createdAt: tenant.createdAt.toISOString(),
          ...(tenant.description != null ? { description: tenant.description } : {}),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: TenantCreatedEvent.version,
          aggregateType: "tenant",
          aggregateId: tenant.id,
          payload: event,
        },
        { tx },
      );

      return tenant;
    });
  }

  async getTenantById(id: string, identityId: string): Promise<Tenant> {
    await requirePermission(this.authorizationClient, identityId, "read", `tenant:${id}`);

    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${id}`);
    }

    return tenant;
  }

  async listTenants(platformId: string, identityId: string): Promise<Tenant[]> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `platform:${PLATFORM_OBJECT_ID}`,
    );

    return this.tenantRepository.findAll();
  }

  async listMyTenants(identityId: string): Promise<Tenant[]> {
    const relationships = await this.authorizationClient.listRelationships({
      namespace: "tenant",
      subject: { namespace: "identity", id: identityId },
    });

    const tenantIds = Array.from(
      new Set(relationships.map((rel) => rel.object.id).filter((id) => id.length > 0)),
    );

    if (tenantIds.length === 0) {
      return [];
    }

    return this.tenantRepository.findByIds(tenantIds);
  }

  async deleteTenant(id: string, platformId: string, identityId: string): Promise<void> {
    await requirePermission(this.authorizationClient, identityId, "suspend", `tenant:${id}`);

    await this.db.transaction(async (tx) => {
      const deleted = await this.tenantRepository.softDelete(id, { tx });
      if (!deleted) {
        throw new TenantNotFoundError(`Tenant not found: ${id}`);
      }

      const event = createCloudEvent({
        type: TenantDeletedEvent.type,
        version: TenantDeletedEvent.version,
        schema: TenantDeletedEvent.schema,
        source: "pine/platform-service",
        subject: id,
        data: {
          id,
          platformId,
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: TenantDeletedEvent.version,
          aggregateType: "tenant",
          aggregateId: id,
          payload: event,
        },
        { tx },
      );
    });
  }
}
