import {
  PLATFORM_OBJECT_ID,
  requirePermission,
  type IAuthorizationClient,
} from "@pine/authorization";
import {
  createCloudEvent,
  TenantCreatedEvent,
  TenantDeletedEvent,
  TenantMemberCreatedEvent,
  type CloudEvent,
  type TenantCreatedData,
  type TenantMemberCreatedData,
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
import { TenantMemberRole, type ITenantMemberRepository } from "@/features/tenant-members";

@injectable()
export class TenantService implements ITenantService {
  constructor(
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.TenantMemberRepository)
    private readonly tenantMemberRepository: ITenantMemberRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async createTenant(input: CreateTenantInput, actorId: string): Promise<Tenant> {
    await requirePermission(
      this.authorizationClient,
      actorId,
      "create_tenant",
      `Platform:${PLATFORM_OBJECT_ID}`,
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

      const ownerMember = await this.tenantMemberRepository.saveTenantMember(
        {
          tenantId: tenant.id,
          identityId: actorId,
          role: TenantMemberRole.OWNER,
        },
        { tx },
      );

      const tenantCreatedEvent: CloudEvent<TenantCreatedData> = createCloudEvent({
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

      const memberCreatedEvent: CloudEvent<TenantMemberCreatedData> = createCloudEvent({
        type: TenantMemberCreatedEvent.type,
        version: TenantMemberCreatedEvent.version,
        schema: TenantMemberCreatedEvent.schema,
        source: "pine/platform-service",
        subject: ownerMember.id,
        data: {
          id: ownerMember.id,
          tenantId: tenant.id,
          identityId: actorId,
          role: TenantMemberRole.OWNER,
          createdAt: ownerMember.createdAt.toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: tenantCreatedEvent.id,
          eventType: tenantCreatedEvent.type,
          eventVersion: TenantCreatedEvent.version,
          aggregateType: "tenant",
          aggregateId: tenant.id,
          payload: tenantCreatedEvent,
        },
        { tx },
      );

      await this.outboxService.schedule(
        {
          eventId: memberCreatedEvent.id,
          eventType: memberCreatedEvent.type,
          eventVersion: TenantMemberCreatedEvent.version,
          aggregateType: "tenant-member",
          aggregateId: tenant.id,
          payload: memberCreatedEvent,
        },
        { tx },
      );

      return tenant;
    });
  }

  async getTenantById(id: string, actorId: string): Promise<Tenant> {
    await requirePermission(this.authorizationClient, actorId, "read", `Tenant:${id}`);

    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${id}`);
    }

    return tenant;
  }

  async listTenants(platformId: string, actorId: string): Promise<Tenant[]> {
    await requirePermission(
      this.authorizationClient,
      actorId,
      "read",
      `Platform:${PLATFORM_OBJECT_ID}`,
    );

    return this.tenantRepository.findAll();
  }

  async listMyTenants(actorId: string): Promise<Tenant[]> {
    const relationships = await this.authorizationClient.listRelationships({
      namespace: "Tenant",
      subject: { namespace: "Identity", id: actorId },
    });

    const tenantIds = Array.from(
      new Set(relationships.map((rel) => rel.object.id).filter((id) => id.length > 0)),
    );

    if (tenantIds.length === 0) {
      return [];
    }

    return this.tenantRepository.findByIds(tenantIds);
  }

  async deleteTenant(id: string, platformId: string, actorId: string): Promise<void> {
    await requirePermission(this.authorizationClient, actorId, "suspend", `Tenant:${id}`);

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
