import { PLATFORM_OBJECT_ID } from "@pine/authorization";
import {
  CloudEvent,
  createCloudEvent,
  TenantCreatedEvent,
  TenantMemberCreatedEvent,
  OrganizationCreatedEvent,
  OrganizationMemberCreatedEvent,
  type TenantCreatedData,
  type TenantMemberCreatedData,
  type OrganizationCreatedData,
  type OrganizationMemberCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, DbClient, Tenant, Organization } from "@/db";
import type { IIdentityRepository } from "@/features/identities/repositories";
import type {
  IPersonalOnboardingService,
  PersonalOrganizationProvision,
} from "@/features/personal-onboarding/services/IPersonalOnboardingService";
import type { ITenantRepository } from "@/features/tenants/repositories";
import { TenantSlugConflictError } from "@/features/tenants/errors";
import type { IOrganizationTypeRepository } from "@/features/organization-types/repositories";
import type {
  IOrganizationPreferenceRepository,
  IOrganizationRepository,
} from "@/features/organizations/repositories";
import {
  OrganizationMemberRole,
  type IOrganizationMemberRepository,
} from "@/features/organization-members";
import { TenantMemberRole, type ITenantMemberRepository } from "@/features/tenant-members";

const PERSONAL_TENANT_NAME = "Personal";
const PERSONAL_ORGANIZATION_NAME = "Personal organization";
const PERSONAL_ORGANIZATION_SLUG = "default";
const PERSONAL_ORGANIZATION_TYPE_NAME = "Personal";
const PERSONAL_ORGANIZATION_TYPE_SLUG = "personal";

const personalTenantSlug = (identityId: string): string => `personal-${identityId}`;

@injectable()
export class PersonalOnboardingService implements IPersonalOnboardingService {
  constructor(
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.OrganizationRepository)
    private readonly organizationRepository: IOrganizationRepository,
    @inject(TYPES.OrganizationTypeRepository)
    private readonly organizationTypeRepository: IOrganizationTypeRepository,
    @inject(TYPES.OrganizationPreferenceRepository)
    private readonly organizationPreferenceRepository: IOrganizationPreferenceRepository,
    @inject(TYPES.OrganizationMemberRepository)
    private readonly organizationMemberRepository: IOrganizationMemberRepository,
    @inject(TYPES.TenantMemberRepository)
    private readonly tenantMemberRepository: ITenantMemberRepository,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async provisionPersonalOrganization(identityId: string): Promise<PersonalOrganizationProvision> {
    const tenantSlug = personalTenantSlug(identityId);

    return this.db.transaction(async (tx) => {
      await this.identityRepository.upsert({ identityId }, { tx });

      const existingTenant = await this.tenantRepository.findBySlug(tenantSlug, { tx });
      if (existingTenant) {
        throw new TenantSlugConflictError(`Personal tenant already exists: ${tenantSlug}`);
      }

      const tenant = await this.tenantRepository.save(
        {
          name: PERSONAL_TENANT_NAME,
          slug: tenantSlug,
          description: "Personal tenant",
          isActive: true,
        },
        { tx },
      );

      const tenantCreated: CloudEvent<TenantCreatedData> = createCloudEvent({
        type: TenantCreatedEvent.type,
        version: TenantCreatedEvent.version,
        schema: TenantCreatedEvent.schema,
        source: "pine/platform-service",
        subject: tenant.id,
        data: {
          id: tenant.id,
          platformId: PLATFORM_OBJECT_ID,
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
          eventId: tenantCreated.id,
          eventType: tenantCreated.type,
          eventVersion: TenantCreatedEvent.version,
          aggregateType: "tenant",
          aggregateId: tenant.id,
          payload: tenantCreated,
        },
        { tx },
      );

      await this.createTenantOwnerMember(tenant.id, identityId, tx);

      const organization = await this.createDefaultOrganization(tenant, identityId, tx);

      await this.organizationPreferenceRepository.upsert(
        {
          identityId,
          organizationId: organization.id,
          tenantId: tenant.id,
        },
        { tx },
      );

      return { tenant, organization };
    });
  }

  private async createTenantOwnerMember(
    tenantId: string,
    identityId: string,
    tx: DbClient,
  ): Promise<void> {
    const ownerMember = await this.tenantMemberRepository.saveTenantMember(
      {
        tenantId,
        identityId,
        role: TenantMemberRole.OWNER,
      },
      { tx },
    );

    const memberCreated: CloudEvent<TenantMemberCreatedData> = createCloudEvent({
      type: TenantMemberCreatedEvent.type,
      version: TenantMemberCreatedEvent.version,
      schema: TenantMemberCreatedEvent.schema,
      source: "pine/platform-service",
      subject: ownerMember.id,
      data: {
        id: ownerMember.id,
        tenantId,
        identityId,
        role: TenantMemberRole.OWNER,
        createdAt: ownerMember.createdAt.toISOString(),
      },
    });

    await this.outboxService.schedule(
      {
        eventId: memberCreated.id,
        eventType: memberCreated.type,
        eventVersion: TenantMemberCreatedEvent.version,
        aggregateType: "tenant-member",
        aggregateId: tenantId,
        payload: memberCreated,
      },
      { tx },
    );
  }

  private async createDefaultOrganization(
    tenant: Tenant,
    identityId: string,
    tx: DbClient,
  ): Promise<Organization> {
    const organizationTypeId = await this.createPersonalOrganizationType(tenant.id, tx);
    const organization = await this.organizationRepository.save(
      {
        tenantId: tenant.id,
        organizationTypeId,
        name: PERSONAL_ORGANIZATION_NAME,
        slug: PERSONAL_ORGANIZATION_SLUG,
        description: "Default personal organization",
        isActive: true,
      },
      { tx },
    );

    const organizationCreated: CloudEvent<OrganizationCreatedData> = createCloudEvent({
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
      },
    });

    await this.outboxService.schedule(
      {
        eventId: organizationCreated.id,
        eventType: organizationCreated.type,
        eventVersion: OrganizationCreatedEvent.version,
        aggregateType: "organization",
        aggregateId: organization.id,
        payload: organizationCreated,
      },
      { tx },
    );

    const ownerMember = await this.organizationMemberRepository.saveOrganizationMember(
      {
        organizationId: organization.id,
        identityId,
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
        identityId,
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
  }

  private async createPersonalOrganizationType(tenantId: string, tx: DbClient): Promise<string> {
    const organizationType = await this.organizationTypeRepository.save(
      {
        tenantId,
        name: PERSONAL_ORGANIZATION_TYPE_NAME,
        slug: PERSONAL_ORGANIZATION_TYPE_SLUG,
        isActive: true,
      },
      { tx },
    );
    return organizationType.id;
  }
}
