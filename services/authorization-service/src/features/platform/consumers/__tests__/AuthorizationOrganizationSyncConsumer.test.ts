import { ORGANIZATION_TENANT } from "@pine/authorization";
import { createCloudEvent, OrganizationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AuthorizationOrganizationSyncConsumer } from "@/features/platform/consumers/AuthorizationOrganizationSyncConsumer";

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

describe("AuthorizationOrganizationSyncConsumer", () => {
  it("writes the organization tenant tuple when an organization is created", async () => {
    const authorizationGraphProvider = createGraphProvider();
    const consumer = new AuthorizationOrganizationSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: OrganizationCreatedEvent.type,
      version: OrganizationCreatedEvent.version,
      schema: OrganizationCreatedEvent.schema,
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
      object: { namespace: "organization", id: "org-1" },
      relation: ORGANIZATION_TENANT,
      subject: { namespace: "tenant", id: "tenant-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
