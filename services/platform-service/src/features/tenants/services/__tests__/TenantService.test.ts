import { InsufficientPermissionError, PLATFORM_OBJECT_ID } from "@pine/authorization";
import { TenantCreatedEvent, TenantDeletedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import {
  TenantNameConflictError,
  TenantNotFoundError,
  TenantSlugConflictError,
} from "@/features/tenants/errors";
import { TenantService } from "@/features/tenants/services/TenantService";

const tenant = {
  id: "tenant-1",
  name: "Acme Corp",
  slug: "acme",
  description: "Primary tenant",
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const identityId = "user-1";
const platformId = "platform-1";

const createDbMock = (tx: unknown = { tx: true }) => ({
  transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
});

const createService = (deps: {
  tenantRepository?: unknown;
  authorizationClient?: unknown;
  outboxService?: unknown;
  db?: unknown;
}) =>
  new TenantService(
    (deps.tenantRepository ?? {}) as never,
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

describe("TenantService", () => {
  it("lists tenants", async () => {
    const tenantRepository = {
      findAll: vi.fn().mockResolvedValue([tenant]),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ tenantRepository, authorizationClient });

    await expect(service.listTenants(platformId, identityId)).resolves.toEqual([tenant]);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "platform",
      object: PLATFORM_OBJECT_ID,
      relation: "read",
      subject: `identity:${identityId}`,
    });
    expect(tenantRepository.findAll).toHaveBeenCalledOnce();
  });

  it("lists my tenants for identity", async () => {
    const tenantRepository = {
      findByIds: vi.fn().mockResolvedValue([tenant]),
    };
    const authorizationClient = {
      listRelationships: vi.fn().mockResolvedValue([
        {
          object: { namespace: "tenant", id: tenant.id },
          relation: "member",
          subject: { namespace: "identity", id: identityId },
        },
      ]),
    };

    const service = createService({ tenantRepository, authorizationClient });

    await expect(service.listMyTenants(identityId)).resolves.toEqual([tenant]);
    expect(authorizationClient.listRelationships).toHaveBeenCalledWith({
      namespace: "tenant",
      subject: { namespace: "identity", id: identityId },
    });
    expect(tenantRepository.findByIds).toHaveBeenCalledWith([tenant.id]);
  });

  it("returns empty list if identity has no tenant relationships", async () => {
    const tenantRepository = {
      findByIds: vi.fn().mockResolvedValue([]),
    };
    const authorizationClient = {
      listRelationships: vi.fn().mockResolvedValue([]),
    };

    const service = createService({ tenantRepository, authorizationClient });

    await expect(service.listMyTenants(identityId)).resolves.toEqual([]);
    expect(tenantRepository.findByIds).not.toHaveBeenCalled();
  });

  it("gets a tenant by id", async () => {
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue(tenant),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ tenantRepository, authorizationClient });

    await expect(service.getTenantById(tenant.id, identityId)).resolves.toEqual(tenant);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "tenant",
      object: tenant.id,
      relation: "read",
      subject: `identity:${identityId}`,
    });
    expect(tenantRepository.findById).toHaveBeenCalledWith(tenant.id);
  });

  it("rejects get by id when user lacks read capability", async () => {
    const tenantRepository = {
      findById: vi.fn(),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ tenantRepository, authorizationClient });

    await expect(service.getTenantById(tenant.id, identityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(tenantRepository.findById).not.toHaveBeenCalled();
  });

  it("throws TenantNotFoundError when getting a missing tenant", async () => {
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ tenantRepository });

    await expect(service.getTenantById("missing", identityId)).rejects.toBeInstanceOf(
      TenantNotFoundError,
    );
  });

  it("rejects list when user lacks read capability", async () => {
    const tenantRepository = {
      findAll: vi.fn(),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ tenantRepository, authorizationClient });

    await expect(service.listTenants(platformId, identityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(tenantRepository.findAll).not.toHaveBeenCalled();
  });

  it("creates a tenant, assigns catalog owner role, and schedules TenantCreated", async () => {
    const tx = { tx: true };
    const db = createDbMock(tx);
    const tenantRepository = {
      existsBySlug: vi.fn().mockResolvedValue(false),
      existsByName: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(tenant),
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
        identityId,
      ),
    ).resolves.toEqual(tenant);

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "platform",
      object: PLATFORM_OBJECT_ID,
      relation: "create_tenant",
      subject: `identity:${identityId}`,
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
    expect(authorizationClient.ensureRelationship).toHaveBeenCalledWith({
      object: { namespace: "tenant", id: tenant.id },
      relation: "owner",
      subject: { namespace: "identity", id: identityId },
    });
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
      service.createTenant({ platformId, name: "Acme Corp", slug: "acme" }, identityId),
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
      service.createTenant({ platformId, name: "Acme Corp", slug: "acme" }, identityId),
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
      service.createTenant({ platformId, name: "Acme Corp", slug: "acme" }, identityId),
    ).rejects.toBeInstanceOf(TenantNameConflictError);

    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("soft-deletes an tenant", async () => {
    const tenantRepository = {
      softDelete: vi.fn().mockResolvedValue(true),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };
    const service = createService({ tenantRepository, authorizationClient, outboxService });

    await expect(service.deleteTenant("tenant-1", platformId, identityId)).resolves.toBeUndefined();
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "tenant",
      object: "tenant-1",
      relation: "suspend",
      subject: `identity:${identityId}`,
    });
    expect(tenantRepository.softDelete).toHaveBeenCalledWith("tenant-1", {
      tx: expect.anything(),
    });
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TenantDeletedEvent.type,
        aggregateType: "tenant",
        aggregateId: "tenant-1",
        payload: expect.objectContaining({
          type: TenantDeletedEvent.type,
          data: { id: "tenant-1", platformId },
        }),
      }),
      { tx: expect.anything() },
    );
  });

  it("rejects delete when user lacks delete capability", async () => {
    const tenantRepository = {
      softDelete: vi.fn(),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ tenantRepository, authorizationClient });

    await expect(service.deleteTenant("tenant-1", platformId, identityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(tenantRepository.softDelete).not.toHaveBeenCalled();
  });

  it("throws TenantNotFoundError when deleting a missing tenant", async () => {
    const tenantRepository = {
      softDelete: vi.fn().mockResolvedValue(false),
    };

    const service = createService({ tenantRepository });

    await expect(service.deleteTenant("missing", platformId, identityId)).rejects.toBeInstanceOf(
      TenantNotFoundError,
    );
  });
});
