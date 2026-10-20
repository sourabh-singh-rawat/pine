import { PLATFORM_OBJECT_ID } from "@pine/authorization";
import { createCloudEvent, TenantCreatedEvent, TenantDeletedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationTenantSyncConsumer } from "@/features/platform/consumers/AuthorizationTenantSyncConsumer";

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

describe("AuthorizationTenantSyncConsumer", () => {
  it("writes the tenant platform tuple when a tenant is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationTenantSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: TenantCreatedEvent.type,
      version: TenantCreatedEvent.version,
      schema: TenantCreatedEvent.schema,
      source: "pine/platform-service",
      subject: "tenant-1",
      data: {
        id: "tenant-1",
        platformId: "platform-1",
        name: "Acme Corp",
        slug: "acme",
        isActive: true,
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "platform",
      subject: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("deletes the tenant platform tuple when a tenant is deleted", async () => {
    const authorizationGraphProvider = createGraphProvider();
    authorizationGraphProvider.listRelationships.mockResolvedValue([
      {
        object: { namespace: "Tenant", id: "tenant-1" },
        relation: "platform",
        subject: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
      },
    ]);
    const consumer = new AuthorizationTenantSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: TenantDeletedEvent.type,
      version: TenantDeletedEvent.version,
      schema: TenantDeletedEvent.schema,
      source: "pine/platform-service",
      subject: "tenant-1",
      data: {
        id: "tenant-1",
        platformId: "platform-1",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "platform",
      subject: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
