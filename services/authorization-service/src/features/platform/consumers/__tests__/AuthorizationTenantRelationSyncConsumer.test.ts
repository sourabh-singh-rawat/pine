import { createCloudEvent, TenantRelationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationTenantRelationSyncConsumer } from "@/features/platform/consumers/AuthorizationTenantRelationSyncConsumer";

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

describe("AuthorizationTenantRelationSyncConsumer", () => {
  it("writes the tenant admin tuple when a tenant relation is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationTenantRelationSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: TenantRelationCreatedEvent.type,
      version: TenantRelationCreatedEvent.version,
      schema: TenantRelationCreatedEvent.schema,
      source: "pine/platform-service",
      subject: "tenant-1:admins:user-1",
      data: {
        id: "tenant-1:admins:user-1",
        tenantId: "tenant-1",
        identityId: "user-1",
        relation: "admins",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "admins",
      subject: { namespace: "Identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("writes owner and member tuples for those relations", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationTenantRelationSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );
    const message = { ack: vi.fn() };

    await consumer.onMessage(
      message as never,
      createCloudEvent({
        type: TenantRelationCreatedEvent.type,
        version: TenantRelationCreatedEvent.version,
        schema: TenantRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: "tenant-1:owners:user-2",
        data: {
          id: "tenant-1:owners:user-2",
          tenantId: "tenant-1",
          identityId: "user-2",
          relation: "owners",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );

    await consumer.onMessage(
      message as never,
      createCloudEvent({
        type: TenantRelationCreatedEvent.type,
        version: TenantRelationCreatedEvent.version,
        schema: TenantRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: "tenant-1:members:user-3",
        data: {
          id: "tenant-1:members:user-3",
          tenantId: "tenant-1",
          identityId: "user-3",
          relation: "members",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "owners",
      subject: { namespace: "Identity", id: "user-2" },
    });
    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "members",
      subject: { namespace: "Identity", id: "user-3" },
    });
  });
});
