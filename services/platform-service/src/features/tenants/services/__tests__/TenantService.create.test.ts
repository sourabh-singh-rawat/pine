import { InsufficientPermissionError, PLATFORM_OBJECT_ID } from "@pine/authorization";
import { TenantCreatedEvent, TenantMemberCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { TenantNameConflictError, TenantSlugConflictError } from "@/features/tenants/errors";
import { TenantService } from "@/features/tenants/services/TenantService";

const tenant = {
  id: "tenant-1",
  name: "Acme Corp",
  slug: "acme",
  description: "Primary tenant",
  isActive: true,
  suspendedAt: null,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const defaultOwnerMember = {
  id: "member-1",
  tenantId: "tenant-1",
  identityId: "user-1",
  role: "owners",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const actorId = "user-1";
const platformId = "platform-1";

const createDbMock = (tx: unknown = { tx: true }) => ({
  transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
});

const createService = (deps: {
  tenantRepository?: unknown;
  tenantMemberRepository?: unknown;
  authorizationClient?: unknown;
  outboxService?: unknown;
  db?: unknown;
}) =>
  new TenantService(
    (deps.tenantRepository ?? {}) as never,
    (deps.tenantMemberRepository ?? {
      saveTenantMember: vi.fn().mockResolvedValue(defaultOwnerMember),
    }) as never,
    (deps.authorizationClient ?? {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
      listRelationships: vi.fn().mockResolvedValue([]),
    }) as never,
    (deps.outboxService ?? {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    }) as never,
    (deps.db ?? createDbMock()) as never,
  );

describe("TenantService createTenant", () => {
  it("creates a tenant, assigns catalog owner role, and schedules TenantCreated", async () => {
    const tx = { tx: true };
    const db = createDbMock(tx);
    const tenantRepository = {
      existsBySlug: vi.fn().mockResolvedValue(false),
      existsByName: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(tenant),
    };
    const ownerMember = {
      id: "member-1",
      tenantId: tenant.id,
      identityId: actorId,
      role: "owners",
      version: 1,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: null,
      deletedAt: null,
    };
    const tenantMemberRepository = {
      saveTenantMember: vi.fn().mockResolvedValue(ownerMember),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({
      tenantRepository,
      tenantMemberRepository,
      authorizationClient,
      outboxService,
      db,
    });

    await expect(
      service.createTenant(
        {
          platformId,
          name: "Acme Corp",
          slug: "acme",
          description: "Primary tenant",
        },
        actorId,
      ),
    ).resolves.toEqual(tenant);

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Platform",
      object: PLATFORM_OBJECT_ID,
      relation: "create_tenant",
      subject: `Identity:${actorId}`,
    });
    expect(tenantRepository.existsBySlug).toHaveBeenCalledWith("acme");
    expect(tenantRepository.existsByName).toHaveBeenCalledWith("Acme Corp");
    expect(db.transaction).toHaveBeenCalledOnce();
    expect(tenantRepository.save).toHaveBeenCalledWith(
      {
        name: "Acme Corp",
        slug: "acme",
        description: "Primary tenant",
        isActive: undefined,
      },
      { tx },
    );
    expect(tenantMemberRepository.saveTenantMember).toHaveBeenCalledWith(
      {
        tenantId: tenant.id,
        identityId: actorId,
        role: "owners",
      },
      { tx },
    );
    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TenantCreatedEvent.type,
        eventVersion: TenantCreatedEvent.version,
        aggregateType: "tenant",
        aggregateId: tenant.id,
        payload: expect.objectContaining({
          type: TenantCreatedEvent.type,
          source: "pine/platform-service",
          subject: tenant.id,
          data: {
            id: tenant.id,
            platformId,
            name: tenant.name,
            slug: tenant.slug,
            isActive: tenant.isActive,
            version: tenant.version,
            createdAt: tenant.createdAt.toISOString(),
            description: tenant.description,
          },
        }),
      }),
      { tx },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TenantMemberCreatedEvent.type,
        eventVersion: TenantMemberCreatedEvent.version,
        aggregateType: "tenant-member",
        aggregateId: tenant.id,
        payload: expect.objectContaining({
          type: TenantMemberCreatedEvent.type,
          source: "pine/platform-service",
          subject: ownerMember.id,
          data: {
            id: ownerMember.id,
            tenantId: tenant.id,
            identityId: actorId,
            role: "owners",
            createdAt: ownerMember.createdAt.toISOString(),
          },
        }),
      }),
      { tx },
    );
  });

  it("rejects create when user lacks create capability", async () => {
    const tenantRepository = {
      existsBySlug: vi.fn(),
      existsByName: vi.fn(),
      save: vi.fn(),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };
    const outboxService = {
      schedule: vi.fn(),
    };

    const service = createService({
      tenantRepository,
      authorizationClient,
      outboxService,
    });

    await expect(
      service.createTenant({ platformId, name: "Acme Corp", slug: "acme" }, actorId),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);

    expect(tenantRepository.existsBySlug).not.toHaveBeenCalled();
    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("rejects create when slug already exists", async () => {
    const tenantRepository = {
      existsBySlug: vi.fn().mockResolvedValue(true),
      existsByName: vi.fn(),
      save: vi.fn(),
    };
    const outboxService = {
      schedule: vi.fn(),
    };

    const service = createService({ tenantRepository, outboxService });

    await expect(
      service.createTenant({ platformId, name: "Acme Corp", slug: "acme" }, actorId),
    ).rejects.toBeInstanceOf(TenantSlugConflictError);

    expect(tenantRepository.existsByName).not.toHaveBeenCalled();
    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("rejects create when name already exists", async () => {
    const tenantRepository = {
      existsBySlug: vi.fn().mockResolvedValue(false),
      existsByName: vi.fn().mockResolvedValue(true),
      save: vi.fn(),
    };
    const outboxService = {
      schedule: vi.fn(),
    };

    const service = createService({ tenantRepository, outboxService });

    await expect(
      service.createTenant({ platformId, name: "Acme Corp", slug: "acme" }, actorId),
    ).rejects.toBeInstanceOf(TenantNameConflictError);

    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });
});
