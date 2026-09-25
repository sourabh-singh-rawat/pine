import { createCloudEvent, ItemCreatedEvent, ItemUpdatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import type { IAuditLogRepository } from "@/features/audit";
import { AuditItemsSyncConsumer } from "@/features/items/consumers/AuditItemsSyncConsumer";
import type { IItemRepository } from "@/features/items/repositories";
import type { ISpaceRepository } from "@/features/spaces/repositories";

const createBroker = () => ({
  client: { jetstream: vi.fn() },
  init: vi.fn(),
  getConfig: vi.fn(),
});

const createDb = () => ({
  transaction: vi.fn(async (callback: (tx: object) => Promise<unknown>) => callback({})),
});

const createItemRepository = (overrides: Partial<IItemRepository> = {}): IItemRepository => ({
  upsert: vi.fn().mockResolvedValue({ id: "item-1" }),
  findById: vi.fn().mockResolvedValue(null),
  ...overrides,
});

const createSpaceRepository = (overrides: Partial<ISpaceRepository> = {}): ISpaceRepository => ({
  upsert: vi.fn().mockResolvedValue({ id: "space-1" }),
  findById: vi.fn().mockResolvedValue(null),
  ...overrides,
});

const createAuditLogRepository = (
  overrides: Partial<IAuditLogRepository> = {},
): IAuditLogRepository => ({
  save: vi.fn().mockResolvedValue({ id: "log-1" }),
  findMany: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe("AuditItemsSyncConsumer", () => {
  it("upserts the item and writes a created audit log on ItemCreatedEvent", async () => {
    const db = createDb();
    const itemRepository = createItemRepository();
    const spaceRepository = createSpaceRepository();
    const auditLogRepository = createAuditLogRepository();
    const consumer = new AuditItemsSyncConsumer(
      createBroker(),
      db,
      itemRepository,
      spaceRepository,
      auditLogRepository,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: ItemCreatedEvent.type,
      version: ItemCreatedEvent.version,
      schema: ItemCreatedEvent.schema,
      source: "pine/items-service",
      subject: "item-1",
      data: {
        id: "item-1",
        name: "Fix login",
        ownerId: "user-1",
        reporterId: "user-1",
        listId: "list-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(message, event);

    expect(itemRepository.upsert).toHaveBeenCalledWith(
      {
        id: "item-1",
        name: "Fix login",
        type: "item",
        listId: "list-1",
        createdById: "user-1",
      },
      { tx: {} },
    );
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      {
        entityType: "item",
        entityId: "item-1",
        action: "created",
        actorId: "user-1",
        payload: {
          id: "item-1",
          name: "Fix login",
          ownerId: "user-1",
          reporterId: "user-1",
          listId: "list-1",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      },
      { tx: {} },
    );
    expect(message.ack).toHaveBeenCalled();
  });

  it("upserts the item and writes an updated audit log on ItemUpdatedEvent", async () => {
    const db = createDb();
    const itemRepository = createItemRepository();
    const spaceRepository = createSpaceRepository();
    const auditLogRepository = createAuditLogRepository();
    const consumer = new AuditItemsSyncConsumer(
      createBroker(),
      db,
      itemRepository,
      spaceRepository,
      auditLogRepository,
    );
    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: ItemUpdatedEvent.type,
      version: ItemUpdatedEvent.version,
      schema: ItemUpdatedEvent.schema,
      source: "pine/items-service",
      subject: "item-1",
      data: {
        id: "item-1",
        name: "Fix login again",
        ownerId: "user-1",
        reporterId: "user-1",
        listId: "list-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        updatedById: "user-2",
        priority: "high",
        type: "task",
      },
    });

    await consumer.onMessage(message, event);

    expect(itemRepository.upsert).toHaveBeenCalledWith(
      {
        id: "item-1",
        name: "Fix login again",
        type: "task",
        listId: "list-1",
        createdById: "user-1",
        priority: "high",
        updatedById: "user-2",
      },
      { tx: {} },
    );
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      {
        entityType: "item",
        entityId: "item-1",
        action: "updated",
        actorId: "user-2",
        payload: {
          id: "item-1",
          name: "Fix login again",
          ownerId: "user-1",
          reporterId: "user-1",
          listId: "list-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          updatedById: "user-2",
          priority: "high",
          type: "task",
        },
      },
      { tx: {} },
    );
    expect(message.ack).toHaveBeenCalled();
  });
});
