import { PLATFORM_OBJECT_ID } from "@pine/authorization";
import {
  TenantCreatedEvent,
  OrganizationCreatedEvent,
  OrganizationRelationCreatedEvent,
} from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { OnboardingService } from "@/features/onboarding/services/OnboardingService";

const identityId = "01900000-0000-7000-8000-000000000001";

const tenant = {
  id: "tenant-1",
  name: "Personal",
  slug: `personal-${identityId}`,
  description: "Personal tenant",
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const organization = {
  id: "organization-1",
  tenantId: tenant.id,
  parentOrganizationId: null,
  officeTypeId: "type-personal",
  name: "Personal organization",
  slug: "default",
  description: "Default personal organization",
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createDbMock = (tx: unknown = {}) => ({
  transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
});

const createService = (deps: {
  identityRepository?: unknown;
  tenantRepository?: unknown;
  organizationRepository?: unknown;
  officeTypeRepository?: unknown;
  organizationPreferenceRepository?: unknown;
  authorizationClient?: unknown;
  outboxService?: unknown;
  db?: unknown;
}) =>
  new OnboardingService(
    (deps.identityRepository ?? {
      upsert: vi.fn().mockResolvedValue({ id: identityId }),
    }) as never,
    (deps.tenantRepository ?? {
      findBySlug: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(tenant),
    }) as never,
    (deps.organizationRepository ?? {
      findMany: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(organization),
    }) as never,
    (deps.officeTypeRepository ?? {
      findManyByTenant: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue({ id: "type-personal" }),
    }) as never,
    (deps.organizationPreferenceRepository ?? {
      upsert: vi.fn().mockResolvedValue({ id: "pref-1" }),
    }) as never,
    (deps.authorizationClient ?? {
      ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
    }) as never,
    (deps.outboxService ?? {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    }) as never,
    (deps.db ?? createDbMock()) as never,
  );

describe("OnboardingService", () => {
  it("provisions a personal tenant, organization, owner relation, and preference", async () => {
    const identityRepository = {
      upsert: vi.fn().mockResolvedValue({ id: identityId }),
    };
    const tenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(tenant),
    };
    const organizationRepository = {
      findMany: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(organization),
    };
    const organizationPreferenceRepository = {
      upsert: vi.fn().mockResolvedValue({ id: "pref-1" }),
    };
    const authorizationClient = {
      ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({
      identityRepository,
      tenantRepository,
      organizationRepository,
      organizationPreferenceRepository,
      authorizationClient,
      outboxService,
    });

    await expect(service.provisionPersonalOrganization(identityId)).resolves.toEqual({
      tenant,
      organization,
      created: true,
    });

    expect(identityRepository.upsert).toHaveBeenCalledWith({ identityId }, { tx: {} });
    expect(tenantRepository.save).toHaveBeenCalledWith(
      {
        name: "Personal",
        slug: `personal-${identityId}`,
        description: "Personal tenant",
        isActive: true,
      },
      { tx: {} },
    );
    expect(authorizationClient.ensureRelationship).toHaveBeenCalledWith({
      object: { namespace: "tenant", id: tenant.id },
      relation: "owner",
      subject: { namespace: "identity", id: identityId },
    });
    expect(organizationRepository.save).toHaveBeenCalledWith(
      {
        tenantId: tenant.id,
        officeTypeId: "type-personal",
        name: "Personal organization",
        slug: "default",
        description: "Default personal organization",
        isActive: true,
      },
      { tx: {} },
    );
    expect(organizationPreferenceRepository.upsert).toHaveBeenCalledWith(
      {
        identityId,
        organizationId: organization.id,
        tenantId: tenant.id,
      },
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TenantCreatedEvent.type,
        aggregateType: "tenant",
        aggregateId: tenant.id,
        payload: expect.objectContaining({
          type: TenantCreatedEvent.type,
          data: expect.objectContaining({
            id: tenant.id,
            platformId: PLATFORM_OBJECT_ID,
            slug: tenant.slug,
          }),
        }),
      }),
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: OrganizationCreatedEvent.type,
        aggregateType: "organization",
        aggregateId: organization.id,
      }),
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: OrganizationRelationCreatedEvent.type,
        aggregateType: "organization-relation",
        payload: expect.objectContaining({
          data: expect.objectContaining({
            organizationId: organization.id,
            identityId,
            relation: "owner",
          }),
        }),
      }),
      { tx: {} },
    );
  });

  it("is idempotent when the personal tenant and organization already exist", async () => {
    const identityRepository = {
      upsert: vi.fn().mockResolvedValue({ id: identityId }),
    };
    const tenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(tenant),
      save: vi.fn(),
    };
    const organizationRepository = {
      findMany: vi.fn().mockResolvedValue([organization]),
      save: vi.fn(),
    };
    const organizationPreferenceRepository = {
      upsert: vi.fn().mockResolvedValue({ id: "pref-1" }),
    };
    const authorizationClient = {
      ensureRelationship: vi.fn(),
    };
    const outboxService = {
      schedule: vi.fn(),
    };

    const service = createService({
      identityRepository,
      tenantRepository,
      organizationRepository,
      organizationPreferenceRepository,
      authorizationClient,
      outboxService,
    });

    await expect(service.provisionPersonalOrganization(identityId)).resolves.toEqual({
      tenant,
      organization,
      created: false,
    });

    expect(identityRepository.upsert).toHaveBeenCalledWith({ identityId }, { tx: {} });
    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(organizationRepository.save).not.toHaveBeenCalled();
    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
    expect(organizationPreferenceRepository.upsert).toHaveBeenCalledWith(
      {
        identityId,
        organizationId: organization.id,
        tenantId: tenant.id,
      },
      { tx: {} },
    );
  });

  it("creates the default organization when the personal tenant already exists", async () => {
    const tenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(tenant),
      save: vi.fn(),
    };
    const organizationRepository = {
      findMany: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(organization),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({
      identityRepository: {
        upsert: vi.fn().mockResolvedValue({ id: identityId }),
      },
      tenantRepository,
      organizationRepository,
      outboxService,
    });

    await expect(service.provisionPersonalOrganization(identityId)).resolves.toEqual({
      tenant,
      organization,
      created: false,
    });

    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(organizationRepository.save).toHaveBeenCalledOnce();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: OrganizationCreatedEvent.type }),
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: OrganizationRelationCreatedEvent.type }),
      { tx: {} },
    );
  });
});
