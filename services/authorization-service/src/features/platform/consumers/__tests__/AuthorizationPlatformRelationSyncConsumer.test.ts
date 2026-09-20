import { ADMIN, MEMBER, PLATFORM_OBJECT_ID } from "@pine/authorization";
import { createCloudEvent, PlatformRelationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationPlatformRelationSyncConsumer } from "@/features/platform/consumers/AuthorizationPlatformRelationSyncConsumer";

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

describe("AuthorizationPlatformRelationSyncConsumer", () => {
  it("writes the platform admin tuple when a platform relation is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationPlatformRelationSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: PlatformRelationCreatedEvent.type,
      version: PlatformRelationCreatedEvent.version,
      schema: PlatformRelationCreatedEvent.schema,
      source: "pine/platform-service",
      subject: `${PLATFORM_OBJECT_ID}:${ADMIN}:user-1`,
      data: {
        id: `${PLATFORM_OBJECT_ID}:${ADMIN}:user-1`,
        identityId: "user-1",
        relation: ADMIN,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "platform", id: PLATFORM_OBJECT_ID },
      relation: ADMIN,
      subject: { namespace: "identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("writes the platform member tuple when the relation is member", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationPlatformRelationSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: PlatformRelationCreatedEvent.type,
      version: PlatformRelationCreatedEvent.version,
      schema: PlatformRelationCreatedEvent.schema,
      source: "pine/platform-service",
      subject: `${PLATFORM_OBJECT_ID}:${MEMBER}:user-2`,
      data: {
        id: `${PLATFORM_OBJECT_ID}:${MEMBER}:user-2`,
        identityId: "user-2",
        relation: MEMBER,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "platform", id: PLATFORM_OBJECT_ID },
      relation: MEMBER,
      subject: { namespace: "identity", id: "user-2" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
