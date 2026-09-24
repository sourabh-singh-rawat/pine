import { LIST_SPACE, OWNER } from "@pine/authorization";
import { createCloudEvent, ListCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationListSyncConsumer } from "@/features/issues/consumers/AuthorizationListSyncConsumer";

const createGraphProvider = () => ({
  listRelationships: vi.fn().mockResolvedValue([]),
  createRelationship: vi.fn().mockResolvedValue(undefined),
  deleteRelationship: vi.fn().mockResolvedValue(undefined),
  checkPermission: vi.fn().mockResolvedValue(false),
});

const createBroker = () => ({
  client: { jetstream: vi.fn() },
  init: vi.fn(),
  getConfig: vi.fn(),
});

describe("AuthorizationListSyncConsumer", () => {
  it("writes the list space and owner tuples when a list is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationListSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: ListCreatedEvent.type,
      version: ListCreatedEvent.version,
      schema: ListCreatedEvent.schema,
      source: "pine/items-service",
      subject: "list-1",
      data: {
        id: "list-1",
        spaceId: "space-1",
        name: "Alpha",
        status: "active",
        ownerUserId: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "list", id: "list-1" },
      relation: LIST_SPACE,
      subject: { namespace: "space", id: "space-1" },
    });
    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "list", id: "list-1" },
      relation: OWNER,
      subject: { namespace: "identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
