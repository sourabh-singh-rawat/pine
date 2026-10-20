import { PLATFORM_OBJECT_ID } from "@pine/authorization";
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
      subject: `${PLATFORM_OBJECT_ID}:admins:user-1`,
      data: {
        id: `${PLATFORM_OBJECT_ID}:admins:user-1`,
        identityId: "user-1",
        relation: "admins",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
      relation: "admins",
      subject: { namespace: "Identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("writes the platform owner tuple when the relation is owner", async () => {
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
      subject: `${PLATFORM_OBJECT_ID}:owners:user-3`,
      data: {
        id: `${PLATFORM_OBJECT_ID}:owners:user-3`,
        identityId: "user-3",
        relation: "owners",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
      relation: "owners",
      subject: { namespace: "Identity", id: "user-3" },
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
      subject: `${PLATFORM_OBJECT_ID}:members:user-2`,
      data: {
        id: `${PLATFORM_OBJECT_ID}:members:user-2`,
        identityId: "user-2",
        relation: "members",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
      relation: "members",
      subject: { namespace: "Identity", id: "user-2" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
