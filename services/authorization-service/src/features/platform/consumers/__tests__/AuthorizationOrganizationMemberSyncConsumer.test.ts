import {
  createCloudEvent,
  OrganizationMemberCreatedEvent,
  OrganizationMemberDeletedEvent,
} from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationOrganizationMemberSyncConsumer } from "@/features/platform/consumers/AuthorizationOrganizationMemberSyncConsumer";

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

describe("AuthorizationOrganizationMemberSyncConsumer", () => {
  it("writes the organization owner tuple when an organization member is created with owner role", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationOrganizationMemberSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: OrganizationMemberCreatedEvent.type,
      version: OrganizationMemberCreatedEvent.version,
      schema: OrganizationMemberCreatedEvent.schema,
      source: "pine/platform-service",
      subject: "member-1",
      data: {
        id: "member-1",
        organizationId: "org-1",
        identityId: "user-1",
        role: "owners",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "Organization", id: "org-1" },
      relation: "owners",
      subject: { namespace: "Identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("removes relationship when an organization member is deleted", async () => {
    const authorizationGraphProvider = createGraphProvider();
    authorizationGraphProvider.listRelationships.mockResolvedValue([
      {
        object: { namespace: "Organization", id: "org-1" },
        relation: "owners",
        subject: { namespace: "Identity", id: "user-1" },
      },
    ]);
    const consumer = new AuthorizationOrganizationMemberSyncConsumer(
      createBroker() as never,
      authorizationGraphProvider as never,
    );

    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: OrganizationMemberDeletedEvent.type,
      version: OrganizationMemberDeletedEvent.version,
      schema: OrganizationMemberDeletedEvent.schema,
      source: "pine/platform-service",
      subject: "member-1",
      data: {
        id: "member-1",
        organizationId: "org-1",
        identityId: "user-1",
        role: "owners",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "Organization", id: "org-1" },
      relation: "owners",
      subject: { namespace: "Identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
