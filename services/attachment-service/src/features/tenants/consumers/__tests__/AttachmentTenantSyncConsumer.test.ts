import { createCloudEvent, TenantCreatedEvent, TenantDeletedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { AttachmentTenantSyncConsumer } from "@/features/tenants/consumers/AttachmentTenantSyncConsumer";

const createBroker = () => ({
  client: { jetstream: vi.fn() },
  init: vi.fn(),
  getConfig: vi.fn(),
});

const createDb = () => ({
  transaction: vi.fn(async (fn: (tx: Record<string, never>) => Promise<void>) => fn({})),
});

describe("AttachmentTenantSyncConsumer", () => {
  it("saves a tenant when it does not already exist", async () => {
    const tenantRepository = {
      existsById: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue({}),
      deactivate: vi.fn(),
      findById: vi.fn(),
    };
    const db = createDb();
    const consumer = new AttachmentTenantSyncConsumer(
      createBroker() as never,
      db as never,
      tenantRepository as never,
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
        name: "Acme Corp",
        slug: "acme",
        isActive: true,
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(tenantRepository.save).toHaveBeenCalledWith(
      {
        id: "tenant-1",
        name: "Acme Corp",
        slug: "acme",
        isActive: true,
      },
      { tx: {} },
    );
    expect(message.ack).toHaveBeenCalled();
  });

  it("skips insert when the tenant already exists", async () => {
    const tenantRepository = {
      existsById: vi.fn().mockResolvedValue(true),
      save: vi.fn(),
      deactivate: vi.fn(),
      findById: vi.fn(),
    };
    const consumer = new AttachmentTenantSyncConsumer(
      createBroker() as never,
      createDb() as never,
      tenantRepository as never,
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
        name: "Acme Corp",
        slug: "acme",
        isActive: true,
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message as never, event);

    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalled();
  });

  it("deactivates a tenant when it is deleted", async () => {
    const tenantRepository = {
      existsById: vi.fn().mockResolvedValue(true),
      save: vi.fn(),
      deactivate: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
    };
    const consumer = new AttachmentTenantSyncConsumer(
      createBroker() as never,
      createDb() as never,
      tenantRepository as never,
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

    await consumer.onMessage(message as never, event);

    expect(tenantRepository.deactivate).toHaveBeenCalledWith("tenant-1", { tx: {} });
    expect(message.ack).toHaveBeenCalled();
  });
});
