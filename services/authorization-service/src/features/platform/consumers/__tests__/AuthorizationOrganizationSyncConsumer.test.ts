import { ORGANIZATION_PARENTS, ORGANIZATION_TENANT } from "@pine/authorization";
import {
  createCloudEvent,
  OrganizationCreatedEvent,
  OrganizationDeletedEvent,
  OrganizationUpdatedEvent,
} from "@pine/events";
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
        officeTypeId: "type-root",
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

  it("writes the parents tuple when a child organization is created", async () => {
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
      subject: "org-2",
      data: {
        id: "org-2",
        tenantId: "tenant-1",
        name: "Acme Division",
        slug: "acme-division",
        isActive: true,
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        officeTypeId: "type-child",
        parentOrganizationId: "org-1",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-2" },
      relation: ORGANIZATION_TENANT,
      subject: { namespace: "tenant", id: "tenant-1" },
    });
    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-2" },
      relation: ORGANIZATION_PARENTS,
      subject: { namespace: "organization", id: "org-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("replaces the parents tuple when an organization is reparented", async () => {
    const authorizationGraphProvider = createGraphProvider();
    authorizationGraphProvider.listRelationships.mockImplementation(
      async (query: { subject?: { id?: string } }) => {
        if (query.subject?.id === "org-1") {
          return [
            {
              object: { namespace: "organization", id: "org-2" },
              relation: ORGANIZATION_PARENTS,
              subject: { namespace: "organization", id: "org-1" },
            },
          ];
        }
        return [];
      },
    );
    const consumer = new AuthorizationOrganizationSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: OrganizationUpdatedEvent.type,
      version: OrganizationUpdatedEvent.version,
      schema: OrganizationUpdatedEvent.schema,
      source: "pine/platform-service",
      subject: "org-2",
      data: {
        id: "org-2",
        tenantId: "tenant-1",
        updatedAt: "2026-01-02T00:00:00.000Z",
        previousParentOrganizationId: "org-1",
        parentOrganizationId: "org-3",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-2" },
      relation: ORGANIZATION_PARENTS,
      subject: { namespace: "organization", id: "org-1" },
    });
    expect(authorizationGraphProvider.createRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-2" },
      relation: ORGANIZATION_PARENTS,
      subject: { namespace: "organization", id: "org-3" },
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("removes the parents tuple when parent is cleared", async () => {
    const authorizationGraphProvider = createGraphProvider();
    authorizationGraphProvider.listRelationships.mockResolvedValue([
      {
        object: { namespace: "organization", id: "org-2" },
        relation: ORGANIZATION_PARENTS,
        subject: { namespace: "organization", id: "org-1" },
      },
    ]);
    const consumer = new AuthorizationOrganizationSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: OrganizationUpdatedEvent.type,
      version: OrganizationUpdatedEvent.version,
      schema: OrganizationUpdatedEvent.schema,
      source: "pine/platform-service",
      subject: "org-2",
      data: {
        id: "org-2",
        tenantId: "tenant-1",
        updatedAt: "2026-01-02T00:00:00.000Z",
        previousParentOrganizationId: "org-1",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-2" },
      relation: ORGANIZATION_PARENTS,
      subject: { namespace: "organization", id: "org-1" },
    });
    expect(authorizationGraphProvider.createRelationship).not.toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalled();
  });

  it("removes tenant and parents tuples when an organization is deleted", async () => {
    const authorizationGraphProvider = createGraphProvider();
    authorizationGraphProvider.listRelationships.mockResolvedValue([
      {
        object: { namespace: "organization", id: "org-2" },
        relation: ORGANIZATION_TENANT,
        subject: { namespace: "tenant", id: "tenant-1" },
      },
    ]);
    const consumer = new AuthorizationOrganizationSyncConsumer(
      createBroker(),
      authorizationGraphProvider,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: OrganizationDeletedEvent.type,
      version: OrganizationDeletedEvent.version,
      schema: OrganizationDeletedEvent.schema,
      source: "pine/platform-service",
      subject: "org-2",
      data: {
        id: "org-2",
        tenantId: "tenant-1",
        deletedAt: "2026-01-03T00:00:00.000Z",
        parentOrganizationId: "org-1",
      },
    });

    await consumer.onMessage(message, event);

    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-2" },
      relation: ORGANIZATION_TENANT,
      subject: { namespace: "tenant", id: "tenant-1" },
    });
    expect(authorizationGraphProvider.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: "org-2" },
      relation: ORGANIZATION_PARENTS,
      subject: { namespace: "organization", id: "org-1" },
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
