import { TenantRelationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { TenantRelationService } from "@/features/tenants/services/TenantRelationService";

const identityId = "user-1";
const actorId = "actor-1";
const tenantId = "tenant-1";

const createDbMock = (tx: unknown = { tx: true }) => ({
  transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
});

describe("TenantRelationService", () => {
  it("schedules a tenant relation created event", async () => {
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
      deleteRelationship: vi.fn().mockResolvedValue({ deleted: true }),
      listRelationships: vi.fn().mockResolvedValue([]),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };
    const db = createDbMock();
    const service = new TenantRelationService(
      authorizationClient as never,
      outboxService as never,
      db as never,
    );

    const relation = await service.create(
      {
        tenantId,
        relation: "admins",
        identityId,
      },
      actorId,
    );

    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TenantRelationCreatedEvent.type,
        eventVersion: TenantRelationCreatedEvent.version,
        aggregateType: "tenant-relation",
        aggregateId: tenantId,
        payload: expect.objectContaining({
          type: TenantRelationCreatedEvent.type,
          subject: `${tenantId}:admins:${identityId}`,
          data: expect.objectContaining({
            tenantId,
            identityId,
            relation: "admins",
          }),
        }),
      }),
      { tx: { tx: true } },
    );
    expect(relation.relation).toBe("admins");
    expect(relation.tenantId).toBe(tenantId);
    expect(relation.identityId).toBe(identityId);
  });
});
