import { PLATFORM_OBJECT_ID } from "@pine/authorization";
import {
  TenantCreatedEvent,
  TenantMemberCreatedEvent,
  OrganizationCreatedEvent,
  OrganizationMemberCreatedEvent,
} from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { PersonalOnboardingService } from "@/features/personal-onboarding/services/PersonalOnboardingService";
import { TenantSlugConflictError } from "@/features/tenants/errors";

const identityId = "01900000-0000-7000-8000-000000000001";

const tenant = {
  id: "tenant-1",
  name: "Personal",
  slug: `personal-${identityId}`,
  description: "Personal tenant",
  isActive: true,
  suspendedAt: null,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const organization = {
  id: "organization-1",
  tenantId: tenant.id,
  parentOrganizationId: null,
  organizationTypeId: "type-personal",
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

const ownerOrganizationMember = {
  id: "org-member-1",
  organizationId: organization.id,
  identityId,
  role: "owners",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const ownerTenantMember = {
  id: "tenant-member-1",
  tenantId: tenant.id,
  identityId,
  role: "owners",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createService = (deps: {
  identityRepository?: unknown;
  tenantRepository?: unknown;
  organizationRepository?: unknown;
  organizationTypeRepository?: unknown;
  organizationPreferenceRepository?: unknown;
  organizationMemberRepository?: unknown;
  tenantMemberRepository?: unknown;
  outboxService?: unknown;
  db?: unknown;
}) =>
  new PersonalOnboardingService(
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
    (deps.organizationTypeRepository ?? {
      save: vi.fn().mockResolvedValue({ id: "type-personal" }),
    }) as never,
    (deps.organizationPreferenceRepository ?? {
      upsert: vi.fn().mockResolvedValue({ id: "pref-1" }),
    }) as never,
    (deps.organizationMemberRepository ?? {
      saveOrganizationMember: vi.fn().mockResolvedValue(ownerOrganizationMember),
    }) as never,
    (deps.tenantMemberRepository ?? {
      saveTenantMember: vi.fn().mockResolvedValue(ownerTenantMember),
    }) as never,
    (deps.outboxService ?? {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    }) as never,
    (deps.db ?? createDbMock()) as never,
  );

describe("PersonalOnboardingService", () => {
  it("provisions a personal tenant, organization, owner members, and preference", async () => {
    const identityRepository = {
      upsert: vi.fn().mockResolvedValue({ id: identityId }),
    };
    const tenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(tenant),
    };
    const organizationRepository = {
      save: vi.fn().mockResolvedValue(organization),
    };
    const organizationPreferenceRepository = {
      upsert: vi.fn().mockResolvedValue({ id: "pref-1" }),
    };
    const tenantMemberRepository = {
      saveTenantMember: vi.fn().mockResolvedValue(ownerTenantMember),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({
      identityRepository,
      tenantRepository,
      organizationRepository,
      organizationPreferenceRepository,
      tenantMemberRepository,
      outboxService,
    });

    await expect(service.provisionPersonalOrganization(identityId)).resolves.toEqual({
      tenant,
      organization,
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
    expect(tenantMemberRepository.saveTenantMember).toHaveBeenCalledWith(
      {
        tenantId: tenant.id,
        identityId,
        role: "owners",
      },
      { tx: {} },
    );
    expect(organizationRepository.save).toHaveBeenCalledWith(
      {
        tenantId: tenant.id,
        organizationTypeId: "type-personal",
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
        eventType: TenantMemberCreatedEvent.type,
        aggregateType: "tenant-member",
        payload: expect.objectContaining({
          data: expect.objectContaining({
            tenantId: tenant.id,
            identityId,
            role: "owners",
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
        eventType: OrganizationMemberCreatedEvent.type,
        aggregateType: "organization-member",
        payload: expect.objectContaining({
          data: expect.objectContaining({
            organizationId: organization.id,
            identityId,
            role: "owners",
          }),
        }),
      }),
      { tx: {} },
    );
  });

  it("throws when the personal tenant already exists", async () => {
    const tenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(tenant),
      save: vi.fn(),
    };
    const tenantMemberRepository = {
      saveTenantMember: vi.fn(),
    };
    const organizationRepository = {
      save: vi.fn(),
    };
    const outboxService = {
      schedule: vi.fn(),
    };

    const service = createService({
      tenantRepository,
      tenantMemberRepository,
      organizationRepository,
      outboxService,
    });

    await expect(service.provisionPersonalOrganization(identityId)).rejects.toBeInstanceOf(
      TenantSlugConflictError,
    );

    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(tenantMemberRepository.saveTenantMember).not.toHaveBeenCalled();
    expect(organizationRepository.save).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });
});
