import { createCloudEvent, TenantMemberCreatedEvent, TenantMemberDeletedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationTenantMemberSyncConsumer } from "@/features/platform/consumers/AuthorizationTenantMemberSyncConsumer";

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

describe("AuthorizationTenantMemberSyncConsumer", () => {
  it("writes the tenant owner tuple when a tenant member is created with owner role", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationTenantMemberSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: TenantMemberCreatedEvent.type,
      version: TenantMemberCreatedEvent.version,
      schema: TenantMemberCreatedEvent.schema,
      source: "pine/platform-service",
      subject: "member-1",
      data: {
        id: "member-1",
        tenantId: "tenant-1",
        identityId: "user-1",
        role: "owners",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "owners",
      subject: { namespace: "Identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("removes relationship when a tenant member is deleted", async () => {
    const authorizationGraphProvider = createGraphProvider();
    authorizationGraphProvider.listRelationships.mockResolvedValue([
      {
        object: { namespace: "Tenant", id: "tenant-1" },
        relation: "owners",
        subject: { namespace: "Identity", id: "user-1" },
      },
    ]);
    const consumer = new AuthorizationTenantMemberSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );

    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: TenantMemberDeletedEvent.type,
      version: TenantMemberDeletedEvent.version,
      schema: TenantMemberDeletedEvent.schema,
      source: "pine/platform-service",
      subject: "member-1",
      data: {
        id: "member-1",
        tenantId: "tenant-1",
        identityId: "user-1",
        role: "owners",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "Tenant", id: "tenant-1" },
      relation: "owners",
      subject: { namespace: "Identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
