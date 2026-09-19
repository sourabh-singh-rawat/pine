import { WORKSPACE_TENANT } from "@pine/authorization";
import { createCloudEvent, WorkspaceCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationWorkspaceSyncConsumer } from "@/features/platform/consumers/AuthorizationWorkspaceSyncConsumer";

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

describe("AuthorizationWorkspaceSyncConsumer", () => {
  it("writes the workspace tenant tuple when an workspace is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationWorkspaceSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: WorkspaceCreatedEvent.type,
      version: WorkspaceCreatedEvent.version,
      schema: WorkspaceCreatedEvent.schema,
      source: "pine/platform-service",
      subject: "org-1",
      data: {
        id: "org-1",
        tenantId: "tenant-1",
        name: "Acme Corp",
        slug: "acme",
        isActive: true,
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "workspace", id: "org-1" },
      relation: WORKSPACE_TENANT,
      subject: { namespace: "tenant", id: "tenant-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
