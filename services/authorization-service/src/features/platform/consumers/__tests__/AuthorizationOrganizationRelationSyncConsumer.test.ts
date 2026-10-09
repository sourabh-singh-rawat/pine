import { ADMIN, MEMBER, OWNER } from "@pine/authorization";
import { createCloudEvent, OrganizationRelationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationOrganizationRelationSyncConsumer } from "@/features/platform/consumers/AuthorizationOrganizationRelationSyncConsumer";

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

describe("AuthorizationOrganizationRelationSyncConsumer", () => {
  it("writes the organization admin tuple when an organization relation is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationOrganizationRelationSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: OrganizationRelationCreatedEvent.type,
      version: OrganizationRelationCreatedEvent.version,
      schema: OrganizationRelationCreatedEvent.schema,
      source: "pine/platform-service",
      subject: "org-1:admin:user-1",
      data: {
        id: "org-1:admin:user-1",
        organizationId: "org-1",
        identityId: "user-1",
        relation: ADMIN,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-1" },
      relation: ADMIN,
      subject: { namespace: "identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("writes owner and member tuples for those relations", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationOrganizationRelationSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };

    await consumer.onMessage(
      message,
      createCloudEvent({
        type: OrganizationRelationCreatedEvent.type,
        version: OrganizationRelationCreatedEvent.version,
        schema: OrganizationRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: "org-1:owner:user-2",
        data: {
          id: "org-1:owner:user-2",
          organizationId: "org-1",
          identityId: "user-2",
          relation: OWNER,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );

    await consumer.onMessage(
      message,
      createCloudEvent({
        type: OrganizationRelationCreatedEvent.type,
        version: OrganizationRelationCreatedEvent.version,
        schema: OrganizationRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: "org-1:member:user-3",
        data: {
          id: "org-1:member:user-3",
          organizationId: "org-1",
          identityId: "user-3",
          relation: MEMBER,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-1" },
      relation: OWNER,
      subject: { namespace: "identity", id: "user-2" },
    });
    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-1" },
      relation: MEMBER,
      subject: { namespace: "identity", id: "user-3" },
    });
  });
});
