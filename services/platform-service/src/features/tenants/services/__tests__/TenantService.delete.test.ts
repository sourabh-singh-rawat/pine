import { InsufficientPermissionError, PLATFORM_OBJECT_ID } from "@pine/authorization";
import { TenantDeletedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { TenantNotFoundError } from "@/features/tenants/errors";
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

describe("TenantService deleteTenant", () => {
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

    await expect(service.deleteTenant("tenant-1", platformId, actorId)).resolves.toBeUndefined();
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Platform",
      object: PLATFORM_OBJECT_ID,
      relation: "delete_tenant",
      subject: `Identity:${actorId}`,
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

    await expect(service.deleteTenant("tenant-1", platformId, actorId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(tenantRepository.softDelete).not.toHaveBeenCalled();
  });

  it("throws TenantNotFoundError when deleting a missing tenant", async () => {
    const tenantRepository = {
      softDelete: vi.fn().mockResolvedValue(false),
    };

    const service = createService({ tenantRepository });

    await expect(service.deleteTenant("missing", platformId, actorId)).rejects.toBeInstanceOf(
      TenantNotFoundError,
    );
  });
});
