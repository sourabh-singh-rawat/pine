import { OWNER, SPACE_WORKSPACE } from "@pine/authorization";
import { createCloudEvent, SpaceCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationSpaceSyncConsumer } from "@/features/issues/consumers/AuthorizationSpaceSyncConsumer";

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

describe("AuthorizationSpaceSyncConsumer", () => {
  it("writes the space workspace and owner tuples when a space is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationSpaceSyncConsumer(createBroker(), authorizationGraphProvider);
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: SpaceCreatedEvent.type,
      version: SpaceCreatedEvent.version,
      schema: SpaceCreatedEvent.schema,
      source: "pine/items-service",
      subject: "space-1",
      data: {
        id: "space-1",
        workspaceId: "workspace-1",
        name: "Engineering",
        createdById: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "space", id: "space-1" },
      relation: SPACE_WORKSPACE,
      subject: { namespace: "workspace", id: "workspace-1" },
    });
    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "space", id: "space-1" },
      relation: OWNER,
      subject: { namespace: "identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
