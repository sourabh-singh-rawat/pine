import { ADMIN, PLATFORM_OBJECT_ID } from "@pine/authorization";
import { PlatformRelationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { PlatformRelationService } from "@/features/platform/services/PlatformRelationService";

const identityId = "user-1";
const actorId = "actor-1";

const createDbMock = (tx: unknown = { tx: true }) => ({
  transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
});

describe("PlatformRelationService", () => {
  it("schedules a platform relation created event", async () => {
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
    const service = new PlatformRelationService(
      authorizationClient as never,
      outboxService as never,
      db as never,
    );

    const relation = await service.create(
      {
        relation: ADMIN,
        identityId,
      },
      actorId,
    );

    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: PlatformRelationCreatedEvent.type,
        eventVersion: PlatformRelationCreatedEvent.version,
        aggregateType: "platform-relation",
        aggregateId: PLATFORM_OBJECT_ID,
        payload: expect.objectContaining({
          type: PlatformRelationCreatedEvent.type,
          subject: `${PLATFORM_OBJECT_ID}:${ADMIN}:${identityId}`,
          data: expect.objectContaining({
            identityId,
            relation: ADMIN,
          }),
        }),
      }),
      { tx: { tx: true } },
    );
    expect(relation.relation).toBe(ADMIN);
    expect(relation.identityId).toBe(identityId);
  });
});
