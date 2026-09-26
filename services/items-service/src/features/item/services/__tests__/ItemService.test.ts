import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { ITEM_PRIORITY } from "@pine/common";
import { ItemCreatedEvent, ItemUpdatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { describe, expect, it, vi } from "vitest";
import type { DbClient, Item, StatusOption } from "@/db";
import { ItemNotFoundError } from "@/features/item/errors";
import type { IItemAssigneeRepository, IItemRepository } from "@/features/item/repositories";
import type { IStatusRepository } from "@/features/item-statuses/repositories";
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
  countByStatusId: vi.fn().mockResolvedValue(0),
  reassignStatus: vi.fn().mockResolvedValue(0),
  ...overrides,
});

const createItemAssigneeRepository = (
  overrides: Partial<IItemAssigneeRepository> = {},
): IItemAssigneeRepository => ({
  saveMany: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const todoStatus: StatusOption = {
  id: "status-1",
  name: "To Do",
  type: "todo",
  color: "#9E9E9E",
  orderIndex: 0,
  listId: "list-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const doneStatus: StatusOption = {
  id: "status-2",
  name: "Done",
  type: "done",
  color: "#4CAF50",
  orderIndex: 1,
  listId: "list-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createStatusRepository = (overrides: Partial<IStatusRepository> = {}): IStatusRepository => ({
  save: vi.fn(),
  saveMany: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByListId: vi.fn().mockResolvedValue([todoStatus, doneStatus]),
  findMaxOrderIndex: vi.fn(),
  softDelete: vi.fn(),
  replaceOrderIndexes: vi.fn(),
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
    statusRepository?: IStatusRepository;
    outboxService?: IOutboxService;
    authorizationClient?: IAuthorizationClient;
  } = {},
) =>
  new ItemService(
    deps.db ?? createDb(),
    deps.itemRepository ?? createItemRepository(),
    deps.itemAssigneeRepository ?? createItemAssigneeRepository(),
    deps.statusRepository ?? createStatusRepository(),
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

  it("returns list items grouped by status including empty groups", async () => {
    const roots = [
      { ...item, id: "zebra", name: "Zebra", statusId: "status-1", hasChildren: false },
      { ...item, id: "apple", name: "Apple", statusId: "status-1", hasChildren: true },
    ];
    const itemRepository = createItemRepository({
      findRootsByList: vi.fn().mockResolvedValue(roots),
    });
    const statusRepository = createStatusRepository({
      findByListId: vi.fn().mockResolvedValue([todoStatus, doneStatus]),
    });
    const service = createService({ itemRepository, statusRepository });

    await expect(service.list({ listId: "list-1", userId: "user-1" })).resolves.toEqual([
      {
        status: todoStatus,
        items: [
          { ...item, id: "apple", name: "Apple", statusId: "status-1", hasChildren: true },
          { ...item, id: "zebra", name: "Zebra", statusId: "status-1", hasChildren: false },
        ],
      },
      {
        status: doneStatus,
        items: [],
      },
    ]);

    expect(itemRepository.findRootsByList).toHaveBeenCalledWith("list-1", "user-1");
    expect(statusRepository.findByListId).toHaveBeenCalledWith("list-1");
  });
});
