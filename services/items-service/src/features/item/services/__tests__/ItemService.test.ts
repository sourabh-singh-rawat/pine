import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { ITEM_PRIORITY } from "@pine/common";
import { ItemCreatedEvent, ItemUpdatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { describe, expect, it, vi } from "vitest";
import type { DbClient, Item } from "@/db";
import { ItemNotFoundError } from "@/features/item/errors";
import type { IItemAssigneeRepository, IItemRepository } from "@/features/item/repositories";
import { type ItemDatabase, ItemService } from "@/features/item/services/ItemService";

const item: Item = {
  id: "issue-1",
  name: "Fix login",
  description: "Users cannot sign in",
  type: "task",
  statusId: "status-1",
  priority: ITEM_PRIORITY.NORMAL,
  listId: "list-1",
  startDate: null,
  dueDate: null,
  createdById: "user-1",
  updatedById: null,
  parentItemId: null,
  estimate: null,
  component: null,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createItemRepository = (overrides: Partial<IItemRepository> = {}): IItemRepository => ({
  save: vi.fn().mockResolvedValue(item),
  update: vi.fn().mockResolvedValue(item),
  softDelete: vi.fn().mockResolvedValue(true),
  findById: vi.fn().mockResolvedValue(null),
  findByIdForUser: vi.fn().mockResolvedValue(null),
  findRootsByList: vi.fn().mockResolvedValue([]),
  findChildren: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createItemAssigneeRepository = (
  overrides: Partial<IItemAssigneeRepository> = {},
): IItemAssigneeRepository => ({
  saveMany: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createOutboxService = (overrides: Partial<IOutboxService> = {}): IOutboxService => ({
  schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
  claimBatch: vi.fn().mockResolvedValue([]),
  complete: vi.fn().mockResolvedValue({ id: "outbox-1" }),
  failed: vi.fn().mockResolvedValue({ id: "outbox-1" }),
  get: vi.fn().mockResolvedValue(null),
  getByEventId: vi.fn().mockResolvedValue(null),
  ...overrides,
});

const createAuthorizationClient = (
  overrides: Partial<IAuthorizationClient> = {},
): IAuthorizationClient => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue({ deleted: true }),
  listRelationships: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const isDbClient = (_value: unknown): _value is DbClient => true;
const mockTxValue: unknown = {};
const mockTx = isDbClient(mockTxValue) ? mockTxValue : undefined;

const createDb = (): ItemDatabase => ({
  transaction: vi.fn(async (callback) => {
    if (!mockTx) {
      throw new Error("mockTx not defined");
    }
    return callback(mockTx);
  }),
});

const createService = (
  deps: {
    db?: ItemDatabase;
    itemRepository?: IItemRepository;
    itemAssigneeRepository?: IItemAssigneeRepository;
    outboxService?: IOutboxService;
    authorizationClient?: IAuthorizationClient;
  } = {},
) =>
  new ItemService(
    deps.db ?? createDb(),
    deps.itemRepository ?? createItemRepository(),
    deps.itemAssigneeRepository ?? createItemAssigneeRepository(),
    deps.outboxService ?? createOutboxService(),
    deps.authorizationClient ?? createAuthorizationClient(),
  );

describe("ItemService", () => {
  it("schedules ItemCreatedEvent when an item is created", async () => {
    const itemRepository = createItemRepository();
    const itemAssigneeRepository = createItemAssigneeRepository();
    const outboxService = createOutboxService();

    const service = createService({
      itemRepository,
      itemAssigneeRepository,
      outboxService,
    });

    await expect(
      service.create({
        userId: "user-1",
        listId: "list-1",
        type: "task",
        name: "Fix login",
        assigneeIds: [],
        description: "Users cannot sign in",
        statusId: "status-1",
      }),
    ).resolves.toBe("issue-1");

    expect(itemRepository.save).toHaveBeenCalledWith(
      {
        listId: "list-1",
        type: "task",
        name: "Fix login",
        description: "Users cannot sign in",
        statusId: "status-1",
        priority: ITEM_PRIORITY.NORMAL,
        estimate: undefined,
        component: undefined,
        createdById: "user-1",
        parentItemId: null,
      },
      { tx: {} },
    );
    expect(itemAssigneeRepository.saveMany).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ItemCreatedEvent.type,
        eventVersion: ItemCreatedEvent.version,
        aggregateType: "item",
        aggregateId: "issue-1",
        payload: expect.objectContaining({
          type: ItemCreatedEvent.type,
          subject: "issue-1",
          data: {
            id: "issue-1",
            name: "Fix login",
            ownerId: "user-1",
            reporterId: "user-1",
            listId: "list-1",
            createdAt: "2026-01-01T00:00:00.000Z",
            description: "Users cannot sign in",
          },
        }),
      }),
      { tx: {} },
    );
  });

  it("schedules ItemUpdatedEvent when an item is updated", async () => {
    const updatedItem: Item = {
      ...item,
      name: "Fix login again",
      updatedById: "user-1",
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      version: 2,
    };
    const itemRepository = createItemRepository({
      update: vi.fn().mockResolvedValue(updatedItem),
    });
    const outboxService = createOutboxService();

    const service = createService({
      itemRepository,
      outboxService,
    });

    await expect(
      service.update({
        itemId: "issue-1",
        userId: "user-1",
        name: "Fix login again",
      }),
    ).resolves.toBeUndefined();

    expect(itemRepository.update).toHaveBeenCalledWith(
      "issue-1",
      "user-1",
      {
        name: "Fix login again",
        description: undefined,
        dueDate: undefined,
        statusId: undefined,
        priority: undefined,
        estimate: undefined,
        component: undefined,
        type: undefined,
        updatedById: "user-1",
      },
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ItemUpdatedEvent.type,
        eventVersion: ItemUpdatedEvent.version,
        aggregateType: "item",
        aggregateId: "issue-1",
        payload: expect.objectContaining({
          type: ItemUpdatedEvent.type,
          subject: "issue-1",
          data: {
            id: "issue-1",
            name: "Fix login again",
            ownerId: "user-1",
            reporterId: "user-1",
            listId: "list-1",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
            updatedById: "user-1",
            description: "Users cannot sign in",
            statusId: "status-1",
            priority: ITEM_PRIORITY.NORMAL,
            type: "task",
          },
        }),
      }),
      { tx: {} },
    );
  });

  it("saves assignees before scheduling ItemCreatedEvent", async () => {
    const itemRepository = createItemRepository();
    const itemAssigneeRepository = createItemAssigneeRepository();
    const outboxService = createOutboxService();

    const service = createService({
      itemRepository,
      itemAssigneeRepository,
      outboxService,
    });

    await service.create({
      userId: "user-1",
      listId: "list-1",
      type: "task",
      name: "Fix login",
      assigneeIds: ["user-2", "user-3"],
      statusId: "status-1",
    });

    expect(itemAssigneeRepository.saveMany).toHaveBeenCalledWith(
      [
        { itemId: "issue-1", userId: "user-2" },
        { itemId: "issue-1", userId: "user-3" },
      ],
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalled();
  });

  it("soft-deletes an item after authorizing delete on the list", async () => {
    const itemRepository = createItemRepository({
      findById: vi.fn().mockResolvedValue(item),
      softDelete: vi.fn().mockResolvedValue(true),
    });
    const authorizationClient = createAuthorizationClient();

    const service = createService({ itemRepository, authorizationClient });

    await expect(service.delete({ id: "issue-1", userId: "user-1" })).resolves.toBeUndefined();

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "list",
      object: "list-1",
      relation: "delete",
      subject: "identity:user-1",
    });
    expect(itemRepository.softDelete).toHaveBeenCalledWith("issue-1");
  });

  it("throws InsufficientPermissionError when delete is not allowed", async () => {
    const itemRepository = createItemRepository({
      findById: vi.fn().mockResolvedValue(item),
    });
    const authorizationClient = createAuthorizationClient({
      checkRelationship: vi.fn().mockResolvedValue(false),
    });

    const service = createService({ itemRepository, authorizationClient });

    await expect(service.delete({ id: "issue-1", userId: "user-1" })).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(itemRepository.softDelete).not.toHaveBeenCalled();
  });

  it("throws ItemNotFoundError when the item is missing", async () => {
    const itemRepository = createItemRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const authorizationClient = createAuthorizationClient();

    const service = createService({ itemRepository, authorizationClient });

    await expect(service.delete({ id: "missing", userId: "user-1" })).rejects.toBeInstanceOf(
      ItemNotFoundError,
    );
    expect(authorizationClient.checkRelationship).not.toHaveBeenCalled();
    expect(itemRepository.softDelete).not.toHaveBeenCalled();
  });

  it("returns list items with hasChildren from the repository", async () => {
    const roots = [
      { ...item, id: "root-with-children", hasChildren: true },
      { ...item, id: "root-without-children", hasChildren: false },
    ];
    const itemRepository = createItemRepository({
      findRootsByList: vi.fn().mockResolvedValue(roots),
    });
    const service = createService({ itemRepository });

    await expect(service.list({ listId: "list-1", userId: "user-1" })).resolves.toEqual(roots);

    expect(itemRepository.findRootsByList).toHaveBeenCalledWith("list-1", "user-1");
  });
});
