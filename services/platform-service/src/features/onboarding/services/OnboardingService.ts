import {
  OWNER,
  PLATFORM_OBJECT_ID,
  tenantOwnerRelationship,
  type IAuthorizationClient,
} from "@pine/authorization";
import {
  CloudEvent,
  createCloudEvent,
  TenantCreatedEvent,
  OrganizationCreatedEvent,
  OrganizationRelationCreatedEvent,
  type TenantCreatedData,
  type OrganizationCreatedData,
  type OrganizationRelationCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, DbClient, Tenant, Organization } from "@/db";
import type { IIdentityRepository } from "@/features/identities/repositories";
import type {
  IOnboardingService,
  PersonalOrganizationProvision,
} from "@/features/onboarding/services/IOnboardingService";
import type { ITenantRepository } from "@/features/tenants/repositories";
import type { IOfficeTypeRepository } from "@/features/office-types/repositories";
import type {
  IOrganizationPreferenceRepository,
  IOrganizationRepository,
} from "@/features/organizations/repositories";

const PERSONAL_TENANT_NAME = "Personal";
const PERSONAL_ORGANIZATION_NAME = "Personal organization";
const PERSONAL_ORGANIZATION_SLUG = "default";
const PERSONAL_OFFICE_TYPE_NAME = "Personal";
const PERSONAL_OFFICE_TYPE_SLUG = "personal";

const personalTenantSlug = (identityId: string): string => `personal-${identityId}`;

@injectable()
export class OnboardingService implements IOnboardingService {
  constructor(
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.OrganizationRepository)
    private readonly organizationRepository: IOrganizationRepository,
    @inject(TYPES.OfficeTypeRepository)
    private readonly officeTypeRepository: IOfficeTypeRepository,
    @inject(TYPES.OrganizationPreferenceRepository)
    private readonly organizationPreferenceRepository: IOrganizationPreferenceRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
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
        const organization = await this.ensureDefaultOrganization(existingTenant, identityId, tx);
        await this.organizationPreferenceRepository.upsert(
          {
            identityId,
            organizationId: organization.id,
            tenantId: existingTenant.id,
          },
          { tx },
        );
        return { tenant: existingTenant, organization, created: false };
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

      await this.authorizationClient.ensureRelationship(
        tenantOwnerRelationship(tenant.id, identityId),
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

      const organization = await this.createDefaultOrganization(tenant, identityId, tx);

      await this.organizationPreferenceRepository.upsert(
        {
          identityId,
          organizationId: organization.id,
          tenantId: tenant.id,
        },
        { tx },
      );

      return { tenant, organization, created: true };
    });
  }

  private async ensureDefaultOrganization(
    tenant: Tenant,
    identityId: string,
    tx: DbClient,
  ): Promise<Organization> {
    const existing = await this.organizationRepository.findMany({
      tenantId: tenant.id,
    });
    const defaultOrganization = existing.find(
      (organization) => organization.slug === PERSONAL_ORGANIZATION_SLUG,
    );
    if (defaultOrganization) {
      return defaultOrganization;
    }

    return this.createDefaultOrganization(tenant, identityId, tx);
  }

  private async ensurePersonalOfficeType(tenantId: string, tx: DbClient): Promise<string> {
    const officeTypes = await this.officeTypeRepository.findManyByTenant(tenantId);
    const existingOfficeType = officeTypes.find(
      (officeType) => officeType.slug === PERSONAL_OFFICE_TYPE_SLUG,
    );
    if (existingOfficeType) {
      return existingOfficeType.id;
    }

    const officeType = await this.officeTypeRepository.save(
      {
        tenantId,
        name: PERSONAL_OFFICE_TYPE_NAME,
        slug: PERSONAL_OFFICE_TYPE_SLUG,
        isActive: true,
      },
      { tx },
    );
    return officeType.id;
  }

  private async createDefaultOrganization(
    tenant: Tenant,
    identityId: string,
    tx: DbClient,
  ): Promise<Organization> {
    const officeTypeId = await this.ensurePersonalOfficeType(tenant.id, tx);
    const organization = await this.organizationRepository.save(
      {
        tenantId: tenant.id,
        officeTypeId,
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
        officeTypeId: organization.officeTypeId,
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
  }
}
