import { InsufficientPermissionError, PLATFORM_OBJECT_ID } from "@pine/authorization";
import { describe, expect, it, vi } from "vitest";
import { TenantNotFoundError } from "@/features/tenants/errors";
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

describe("TenantService queries", () => {
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

    await expect(service.listTenants(platformId, actorId)).resolves.toEqual([tenant]);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Platform",
      object: PLATFORM_OBJECT_ID,
      relation: "read",
      subject: `Identity:${actorId}`,
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
          object: { namespace: "Tenant", id: tenant.id },
          relation: "members",
          subject: { namespace: "Identity", id: actorId },
        },
      ]),
    };

    const service = createService({ tenantRepository, authorizationClient });

    await expect(service.listMyTenants(actorId)).resolves.toEqual([tenant]);
    expect(authorizationClient.listRelationships).toHaveBeenCalledWith({
      namespace: "Tenant",
      subject: { namespace: "Identity", id: actorId },
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

    await expect(service.listMyTenants(actorId)).resolves.toEqual([]);
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

    await expect(service.getTenantById(tenant.id, actorId)).resolves.toEqual(tenant);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Tenant",
      object: tenant.id,
      relation: "read",
      subject: `Identity:${actorId}`,
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

    await expect(service.getTenantById(tenant.id, actorId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(tenantRepository.findById).not.toHaveBeenCalled();
  });

  it("throws TenantNotFoundError when getting a missing tenant", async () => {
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ tenantRepository });

    await expect(service.getTenantById("missing", actorId)).rejects.toBeInstanceOf(
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

    await expect(service.listTenants(platformId, actorId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(tenantRepository.findAll).not.toHaveBeenCalled();
  });
});
