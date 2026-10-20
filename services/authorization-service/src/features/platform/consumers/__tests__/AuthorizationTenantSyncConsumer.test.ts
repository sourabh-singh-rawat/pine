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
  it("writes the tenant owners and admins subject sets when a tenant is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationTenantSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
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
        name: "Acme Tenant",
        slug: "acme-tenant",
        isActive: true,
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "owners",
      subjectSet: { namespace: "Platform", id: "platform-1", relation: "owners" },
    });
    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "admins",
      subjectSet: { namespace: "Platform", id: "platform-1", relation: "admins" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("removes the tenant owners and admins subject sets when a tenant is deleted", async () => {
    const authorizationGraphProvider = createGraphProvider();
    authorizationGraphProvider.listRelationships.mockResolvedValue([
      {
        object: { namespace: "Tenant", id: "tenant-1" },
        relation: "owners",
        subjectSet: { namespace: "Platform", id: "platform-1", relation: "owners" },
      },
      {
        object: { namespace: "Tenant", id: "tenant-1" },
        relation: "admins",
        subjectSet: { namespace: "Platform", id: "platform-1", relation: "admins" },
      },
    ]);
    const consumer = new AuthorizationTenantSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
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

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "owners",
      subjectSet: { namespace: "Platform", id: "platform-1", relation: "owners" },
    });
    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "admins",
      subjectSet: { namespace: "Platform", id: "platform-1", relation: "admins" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("acks message when event type is unhandled", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationTenantSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = {
      id: "evt-1",
      type: "unhandled.event",
      source: "pine/test",
      specversion: "1.0",
      subject: "tenant-1",
      time: "2026-01-01T00:00:00.000Z",
      datacontenttype: "application/json",
      dataschema: "http://example.com/schema",
      data: {
        id: "tenant-1",
        platformId: "platform-1",
      },
    };

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).not.toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalled();
  });
});
