import { createCloudEvent, ProfileCreatedEvent, ProfileDeletedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationProfileSyncConsumer } from "@/features/identity/consumers/AuthorizationProfileSyncConsumer";

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

describe("AuthorizationProfileSyncConsumer", () => {
  it("writes the profile identity tuple when a profile is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationProfileSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: ProfileCreatedEvent.type,
      version: ProfileCreatedEvent.version,
      schema: ProfileCreatedEvent.schema,
      source: "pine/identity-service",
      subject: "profile-1",
      data: {
        id: "profile-1",
        identityId: "identity-1",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "profile", id: "profile-1" },
      relation: "identity",
      subject: { namespace: "identity", id: "identity-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("deletes the profile identity tuple when a profile is deleted", async () => {
    const authorizationGraphProvider = createGraphProvider();
    authorizationGraphProvider.listRelationships.mockResolvedValue([
      {
        object: { namespace: "profile", id: "profile-1" },
        relation: "identity",
        subject: { namespace: "identity", id: "identity-1" },
      },
    ]);
    const consumer = new AuthorizationProfileSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: ProfileDeletedEvent.type,
      version: ProfileDeletedEvent.version,
      schema: ProfileDeletedEvent.schema,
      source: "pine/identity-service",
      subject: "profile-1",
      data: {
        id: "profile-1",
        identityId: "identity-1",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "profile", id: "profile-1" },
      relation: "identity",
      subject: { namespace: "identity", id: "identity-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
