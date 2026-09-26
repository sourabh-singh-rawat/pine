import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { ListNotFoundError, STATUS_TYPE } from "@pine/common";
import { describe, expect, it, vi } from "vitest";
import type { DbClient, List, Space, StatusOption } from "@/db";
import type { IItemRepository } from "@/features/item/repositories";
import {
  StatusNotFoundError,
  StatusReorderError,
  StatusValidationError,
} from "@/features/item-statuses/errors";
import type { IStatusRepository } from "@/features/item-statuses/repositories";
import { StatusService } from "@/features/item-statuses/services/StatusService";
import type { IListRepository } from "@/features/lists/repositories";
import { SpaceNotFoundError } from "@/features/spaces/errors";
import type { ISpaceRepository } from "@/features/spaces/repositories";

const list: List = {
  id: "list-1",
  spaceId: "space-1",
  name: "List",
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const space: Space = {
  id: "space-1",
  workspaceId: "workspace-1",
  name: "Space",
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const statusTodo: StatusOption = {
  id: "status-todo",
  name: "To Do",
  type: STATUS_TYPE.ACTIVE,
  color: "#64748B",
  orderIndex: 0,
  listId: "list-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const statusDone: StatusOption = {
  id: "status-done",
  name: "Done",
  type: STATUS_TYPE.CLOSED,
  color: "#16A34A",
  orderIndex: 1,
  listId: "list-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createStatusRepository = (overrides: Partial<IStatusRepository> = {}): IStatusRepository => ({
  save: vi.fn().mockResolvedValue(statusTodo),
  saveMany: vi.fn().mockResolvedValue([statusTodo, statusDone]),
  update: vi.fn().mockResolvedValue(statusTodo),
  findById: vi.fn().mockResolvedValue(statusTodo),
  findByListId: vi.fn().mockResolvedValue([statusTodo, statusDone]),
  findMaxOrderIndex: vi.fn().mockResolvedValue(1),
  softDelete: vi.fn().mockResolvedValue(true),
  replaceOrderIndexes: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const createItemRepository = (overrides: Partial<IItemRepository> = {}): IItemRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  findById: vi.fn(),
  findByIdForUser: vi.fn(),
  findRootsByList: vi.fn(),
  findChildren: vi.fn(),
  countByStatusId: vi.fn().mockResolvedValue(0),
  reassignStatus: vi.fn().mockResolvedValue(0),
  ...overrides,
});

const createListRepository = (overrides: Partial<IListRepository> = {}): IListRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue(list),
  findBySpaceId: vi.fn(),
  ...overrides,
});

const createSpaceRepository = (overrides: Partial<ISpaceRepository> = {}): ISpaceRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue(space),
  findMany: vi.fn(),
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

const createDatabase = () => ({
  transaction: vi.fn(async (callback: (tx: DbClient) => Promise<unknown>) => {
    if (!isDbClient(mockTxValue)) {
      throw new Error("expected mock tx");
    }
    return callback(mockTxValue);
  }),
});

const createService = (
  deps: {
    statusRepository?: IStatusRepository;
    itemRepository?: IItemRepository;
    listRepository?: IListRepository;
    spaceRepository?: ISpaceRepository;
    authorizationClient?: IAuthorizationClient;
    database?: ReturnType<typeof createDatabase>;
  } = {},
) =>
  new StatusService(
    deps.database ?? createDatabase(),
    deps.statusRepository ?? createStatusRepository(),
    deps.itemRepository ?? createItemRepository(),
    deps.listRepository ?? createListRepository(),
    deps.spaceRepository ?? createSpaceRepository(),
    deps.authorizationClient ?? createAuthorizationClient(),
  );

describe("StatusService", () => {
  it("lists statuses after list read authz", async () => {
    const authorizationClient = createAuthorizationClient();
    const statusRepository = createStatusRepository();
    const service = createService({ authorizationClient, statusRepository });

    const result = await service.list({ listId: "list-1", identityId: "user-1" });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "list",
      object: "list-1",
      relation: "read",
      subject: "identity:user-1",
    });
    expect(statusRepository.findByListId).toHaveBeenCalledWith("list-1");
    expect(result).toEqual([statusTodo, statusDone]);
  });

  it("creates a status with normalized color and next order index", async () => {
    const statusRepository = createStatusRepository({
      findByListId: vi.fn().mockResolvedValue([statusTodo, statusDone]),
      findMaxOrderIndex: vi.fn().mockResolvedValue(1),
      save: vi.fn().mockResolvedValue({
        ...statusTodo,
        id: "status-review",
        name: "In Review",
        type: STATUS_TYPE.ACTIVE,
        color: "#7C3AED",
        orderIndex: 2,
      }),
    });
    const service = createService({ statusRepository });

    const created = await service.create({
      listId: "list-1",
      name: "  In Review  ",
      type: STATUS_TYPE.ACTIVE,
      color: "#7c3aed",
      identityId: "user-1",
    });

    expect(statusRepository.save).toHaveBeenCalledWith({
      listId: "list-1",
      name: "In Review",
      type: STATUS_TYPE.ACTIVE,
      color: "#7C3AED",
      orderIndex: 2,
    });
    expect(created.name).toBe("In Review");
  });

  it("rejects duplicate status names on create", async () => {
    const service = createService();

    await expect(
      service.create({
        listId: "list-1",
        name: "to do",
        type: STATUS_TYPE.ACTIVE,
        color: "#111111",
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(StatusValidationError);
  });

  it("updates name type and color", async () => {
    const statusRepository = createStatusRepository({
      update: vi.fn().mockResolvedValue({
        ...statusTodo,
        name: "Backlog",
        type: STATUS_TYPE.ACTIVE,
        color: "#0EA5E9",
      }),
    });
    const service = createService({ statusRepository });

    const updated = await service.update({
      id: "status-todo",
      name: "Backlog",
      type: STATUS_TYPE.ACTIVE,
      color: "#0ea5e9",
      identityId: "user-1",
    });

    expect(statusRepository.update).toHaveBeenCalledWith("status-todo", {
      name: "Backlog",
      type: STATUS_TYPE.ACTIVE,
      color: "#0EA5E9",
    });
    expect(updated.name).toBe("Backlog");
  });

  it("reorders statuses when ids are a permutation", async () => {
    const statusRepository = createStatusRepository({
      findByListId: vi
        .fn()
        .mockResolvedValueOnce([statusTodo, statusDone])
        .mockResolvedValueOnce([statusDone, statusTodo]),
    });
    const service = createService({ statusRepository });

    const result = await service.reorder({
      listId: "list-1",
      statusIds: ["status-done", "status-todo"],
      identityId: "user-1",
    });

    expect(statusRepository.replaceOrderIndexes).toHaveBeenCalledWith([
      "status-done",
      "status-todo",
    ]);
    expect(result[0]?.id).toBe("status-done");
  });

  it("rejects invalid reorder permutations", async () => {
    const service = createService();

    await expect(
      service.reorder({
        listId: "list-1",
        statusIds: ["status-todo"],
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(StatusReorderError);
  });

  it("deletes an unused status and compact orders", async () => {
    const database = createDatabase();
    const statusRepository = createStatusRepository({
      findByListId: vi
        .fn()
        .mockResolvedValueOnce([statusTodo, statusDone])
        .mockResolvedValueOnce([statusDone]),
    });
    const itemRepository = createItemRepository({
      countByStatusId: vi.fn().mockResolvedValue(0),
    });
    const service = createService({ database, statusRepository, itemRepository });

    await service.delete({ id: "status-todo", identityId: "user-1" });

    expect(itemRepository.reassignStatus).not.toHaveBeenCalled();
    expect(statusRepository.softDelete).toHaveBeenCalledWith("status-todo", {
      tx: mockTxValue,
    });
    expect(statusRepository.replaceOrderIndexes).toHaveBeenCalledWith(["status-done"], {
      tx: mockTxValue,
    });
  });

  it("requires replacement when status is in use", async () => {
    const itemRepository = createItemRepository({
      countByStatusId: vi.fn().mockResolvedValue(3),
    });
    const service = createService({ itemRepository });

    await expect(
      service.delete({ id: "status-todo", identityId: "user-1" }),
    ).rejects.toBeInstanceOf(StatusValidationError);
  });

  it("remaps items then soft-deletes when replacement is provided", async () => {
    const database = createDatabase();
    const statusRepository = createStatusRepository({
      findByListId: vi
        .fn()
        .mockResolvedValueOnce([statusTodo, statusDone])
        .mockResolvedValueOnce([statusDone]),
    });
    const itemRepository = createItemRepository({
      countByStatusId: vi.fn().mockResolvedValue(2),
      reassignStatus: vi.fn().mockResolvedValue(2),
    });
    const service = createService({ database, statusRepository, itemRepository });

    await service.delete({
      id: "status-todo",
      replacementStatusId: "status-done",
      identityId: "user-1",
    });

    expect(itemRepository.reassignStatus).toHaveBeenCalledWith("status-todo", "status-done", {
      tx: mockTxValue,
    });
    expect(statusRepository.softDelete).toHaveBeenCalledWith("status-todo", {
      tx: mockTxValue,
    });
  });

  it("rejects deleting the last status", async () => {
    const statusRepository = createStatusRepository({
      findById: vi.fn().mockResolvedValue(statusTodo),
      findByListId: vi.fn().mockResolvedValue([statusTodo]),
    });
    const service = createService({ statusRepository });

    await expect(
      service.delete({ id: "status-todo", identityId: "user-1" }),
    ).rejects.toBeInstanceOf(StatusValidationError);
  });

  it("throws when list is missing", async () => {
    const listRepository = createListRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const service = createService({ listRepository });

    await expect(service.list({ listId: "missing", identityId: "user-1" })).rejects.toBeInstanceOf(
      ListNotFoundError,
    );
  });

  it("throws when status is missing", async () => {
    const statusRepository = createStatusRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const service = createService({ statusRepository });

    await expect(
      service.update({ id: "missing", name: "X", identityId: "user-1" }),
    ).rejects.toBeInstanceOf(StatusNotFoundError);
  });

  it("throws when space is missing on update authz path", async () => {
    const spaceRepository = createSpaceRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const service = createService({ spaceRepository });

    await expect(
      service.create({
        listId: "list-1",
        name: "Blocked",
        type: STATUS_TYPE.ACTIVE,
        color: "#111111",
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(SpaceNotFoundError);
  });

  it("propagates insufficient permission", async () => {
    const authorizationClient = createAuthorizationClient({
      checkRelationship: vi.fn().mockRejectedValue(new InsufficientPermissionError()),
    });
    const service = createService({ authorizationClient });

    await expect(service.list({ listId: "list-1", identityId: "user-1" })).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
  });
});
