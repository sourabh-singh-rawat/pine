import { OWNER, PROJECT_SPACE } from "@pine/authorization";
import { createCloudEvent, ProjectCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationProjectSyncConsumer } from "@/features/issues/consumers/AuthorizationProjectSyncConsumer";

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

describe("AuthorizationProjectSyncConsumer", () => {
  it("writes the project space and owner tuples when a project is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationProjectSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: ProjectCreatedEvent.type,
      version: ProjectCreatedEvent.version,
      schema: ProjectCreatedEvent.schema,
      source: "pine/issues-service",
      subject: "project-1",
      data: {
        id: "project-1",
        spaceId: "space-1",
        name: "Alpha",
        status: "active",
        ownerUserId: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "project", id: "project-1" },
      relation: PROJECT_SPACE,
      subject: { namespace: "space", id: "space-1" },
    });
    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "project", id: "project-1" },
      relation: OWNER,
      subject: { namespace: "identity", id: "user-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
