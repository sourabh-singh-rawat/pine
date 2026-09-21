import { ITEM_PROJECT, OWNER } from "@pine/authorization";
import { createCloudEvent, ItemCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationItemSyncConsumer } from "@/features/issues/consumers/AuthorizationItemSyncConsumer";

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

describe("AuthorizationItemSyncConsumer", () => {
  it("writes the item project and owner tuples when an issue is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationItemSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: ItemCreatedEvent.type,
      version: ItemCreatedEvent.version,
      schema: ItemCreatedEvent.schema,
      source: "pine/items-service",
      subject: "issue-1",
      data: {
        id: "issue-1",
        name: "Fix login",
        ownerId: "user-1",
        reporterId: "user-2",
        projectId: "project-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "item", id: "issue-1" },
      relation: ITEM_PROJECT,
      subject: { namespace: "project", id: "project-1" },
    });
    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "item", id: "issue-1" },
      relation: OWNER,
      subject: { namespace: "identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
