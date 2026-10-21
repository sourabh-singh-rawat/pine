import { InsufficientPermissionError, PLATFORM_OBJECT_ID } from "@pine/authorization";
import { TenantSuspendedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { TenantAlreadySuspendedError, TenantNotFoundError } from "@/features/tenants/errors";
import { TenantService } from "@/features/tenants/services/TenantService";

const platformId = "platform-1";
const actorId = "user-1";

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
      saveTenantMember: vi.fn(),
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

describe("TenantService suspendTenant", () => {
  it("suspends a tenant", async () => {
    const suspendedAt = new Date("2026-04-01T12:00:00.000Z");
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "tenant-1",
        name: "Acme",
        slug: "acme",
        description: null,
        isActive: true,
        suspendedAt: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: null,
        deletedAt: null,
        version: 1,
      }),
      suspend: vi.fn().mockResolvedValue({
        id: "tenant-1",
        name: "Acme",
        slug: "acme",
        description: null,
        isActive: false,
        suspendedAt,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: suspendedAt,
        deletedAt: null,
        version: 2,
      }),
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

    const result = await service.suspendTenant("tenant-1", platformId, actorId);

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Platform",
      object: PLATFORM_OBJECT_ID,
      relation: "suspend_tenant",
      subject: `Identity:${actorId}`,
    });
    expect(tenantRepository.suspend).toHaveBeenCalledWith("tenant-1", {
      tx: expect.anything(),
    });
    expect(result.suspendedAt).toEqual(suspendedAt);
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TenantSuspendedEvent.type,
        aggregateType: "tenant",
        aggregateId: "tenant-1",
        payload: expect.objectContaining({
          type: TenantSuspendedEvent.type,
          data: {
            id: "tenant-1",
            platformId,
            suspendedAt: suspendedAt.toISOString(),
          },
        }),
      }),
      { tx: expect.anything() },
    );
  });

  it("rejects suspend when user lacks suspend_tenant", async () => {
    const tenantRepository = {
      findById: vi.fn(),
      suspend: vi.fn(),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };
    const service = createService({ tenantRepository, authorizationClient });

    await expect(service.suspendTenant("tenant-1", platformId, actorId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(tenantRepository.findById).not.toHaveBeenCalled();
    expect(tenantRepository.suspend).not.toHaveBeenCalled();
  });

  it("throws TenantAlreadySuspendedError when tenant is already suspended", async () => {
    const suspendedAt = new Date("2026-03-01T00:00:00.000Z");
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "tenant-1",
        suspendedAt,
        isActive: false,
      }),
      suspend: vi.fn(),
    };
    const service = createService({ tenantRepository });

    await expect(service.suspendTenant("tenant-1", platformId, actorId)).rejects.toBeInstanceOf(
      TenantAlreadySuspendedError,
    );
    expect(tenantRepository.suspend).not.toHaveBeenCalled();
  });

  it("throws TenantNotFoundError when suspending a missing tenant", async () => {
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue(null),
      suspend: vi.fn(),
    };
    const service = createService({ tenantRepository });

    await expect(service.suspendTenant("missing", platformId, actorId)).rejects.toBeInstanceOf(
      TenantNotFoundError,
    );
    expect(tenantRepository.suspend).not.toHaveBeenCalled();
  });
});
