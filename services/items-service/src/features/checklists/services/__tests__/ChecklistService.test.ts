import {
  InsufficientPermissionError,
  type IAuthorizationClient,
} from "@pine/authorization";
import { ITEM_PRIORITY } from "@pine/common";
import { describe, expect, it, vi } from "vitest";
import type { Checklist, ChecklistEntry, DbClient, Item, Project, Space } from "@/db";
import {
  ChecklistEntryNotFoundError,
  ChecklistNotFoundError,
  ChecklistReorderError,
  ChecklistValidationError,
} from "@/features/checklists/errors";
import type {
  IChecklistEntryRepository,
  IChecklistRepository,
} from "@/features/checklists/repositories";
import {
  ChecklistService,
  type ChecklistDatabase,
} from "@/features/checklists/services/ChecklistService";
import { ItemNotFoundError } from "@/features/item/errors";
import type { IItemRepository } from "@/features/item/repositories";
import type { IProjectRepository } from "@/features/project/repositories";
import type { ISpaceRepository } from "@/features/spaces/repositories";

const item: Item = {
  id: "item-1",
  name: "Fix login",
  description: "Users cannot sign in",
  type: "task",
  statusId: "status-1",
  priority: ITEM_PRIORITY.NORMAL,
  projectId: "project-1",
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

const project: Project = {
  id: "project-1",
  spaceId: "space-1",
  name: "Project",
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

const checklist: Checklist = {
  id: "checklist-1",
  itemId: "item-1",
  name: "Launch",
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-02T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const entryA: ChecklistEntry = {
  id: "entry-a",
  checklistId: "checklist-1",
  title: "Write docs",
  completed: false,
  orderIndex: 0,
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-02T00:01:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const entryB: ChecklistEntry = {
  id: "entry-b",
  checklistId: "checklist-1",
  title: "Ship it",
  completed: true,
  orderIndex: 1,
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-02T00:02:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const isDbClient = (_value: unknown): _value is DbClient => true;
const mockTxValue: unknown = {};
const mockTx = isDbClient(mockTxValue) ? mockTxValue : undefined;

const createDb = (): ChecklistDatabase => ({
  transaction: vi.fn(async (callback) => {
    if (!mockTx) {
      throw new Error("mockTx not defined");
    }
    return callback(mockTx);
  }),
});

const createItemRepository = (
  overrides: Partial<IItemRepository> = {},
): IItemRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  findById: vi.fn().mockResolvedValue(item),
  findByIdForUser: vi.fn(),
  findRootsByProject: vi.fn(),
  findChildren: vi.fn(),
  ...overrides,
});

const createChecklistRepository = (
  overrides: Partial<IChecklistRepository> = {},
): IChecklistRepository => ({
  save: vi.fn().mockResolvedValue(checklist),
  update: vi.fn().mockResolvedValue(checklist),
  findById: vi.fn().mockResolvedValue(checklist),
  findByItemId: vi.fn().mockResolvedValue([checklist]),
  softDelete: vi.fn().mockResolvedValue(true),
  ...overrides,
});

const createChecklistEntryRepository = (
  overrides: Partial<IChecklistEntryRepository> = {},
): IChecklistEntryRepository => ({
  save: vi.fn().mockResolvedValue(entryA),
  update: vi.fn().mockResolvedValue(entryA),
  findById: vi.fn().mockResolvedValue(entryA),
  findByChecklistId: vi.fn().mockResolvedValue([entryA, entryB]),
  findByChecklistIds: vi.fn().mockResolvedValue([entryA, entryB]),
  findMaxOrderIndex: vi.fn().mockResolvedValue(1),
  softDelete: vi.fn().mockResolvedValue(true),
  softDeleteByChecklistId: vi.fn().mockResolvedValue(2),
  replaceOrderIndexes: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const createProjectRepository = (
  overrides: Partial<IProjectRepository> = {},
): IProjectRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue(project),
  findBySpaceId: vi.fn(),
  ...overrides,
});

const createSpaceRepository = (
  overrides: Partial<ISpaceRepository> = {},
): ISpaceRepository => ({
  save: vi.fn(),
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

const createService = (deps: {
  db?: ChecklistDatabase;
  checklistRepository?: IChecklistRepository;
  checklistEntryRepository?: IChecklistEntryRepository;
  itemRepository?: IItemRepository;
  projectRepository?: IProjectRepository;
  spaceRepository?: ISpaceRepository;
  authorizationClient?: IAuthorizationClient;
} = {}) =>
  new ChecklistService(
    deps.db ?? createDb(),
    deps.checklistRepository ?? createChecklistRepository(),
    deps.checklistEntryRepository ?? createChecklistEntryRepository(),
    deps.itemRepository ?? createItemRepository(),
    deps.projectRepository ?? createProjectRepository(),
    deps.spaceRepository ?? createSpaceRepository(),
    deps.authorizationClient ?? createAuthorizationClient(),
  );

describe("ChecklistService", () => {
  it("lists checklists after authorizing read on the workspace", async () => {
    const authorizationClient = createAuthorizationClient();
    const checklistRepository = createChecklistRepository();
    const checklistEntryRepository = createChecklistEntryRepository();
    const service = createService({
      authorizationClient,
      checklistRepository,
      checklistEntryRepository,
    });

    const result = await service.list({ itemId: "item-1", identityId: "user-1" });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "workspace",
      object: "workspace-1",
      relation: "read",
      subject: "identity:user-1",
    });
    expect(checklistRepository.findByItemId).toHaveBeenCalledWith("item-1");
    expect(checklistEntryRepository.findByChecklistIds).toHaveBeenCalledWith([
      "checklist-1",
    ]);
    expect(result).toEqual([
      {
        checklist,
        entries: [entryA, entryB],
        completedCount: 1,
        totalCount: 2,
      },
    ]);
  });

  it("creates a checklist after authorizing create_project on the workspace", async () => {
    const authorizationClient = createAuthorizationClient();
    const checklistRepository = createChecklistRepository();
    const service = createService({ authorizationClient, checklistRepository });

    const result = await service.create({
      itemId: "item-1",
      name: "  Launch  ",
      identityId: "user-1",
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "workspace",
      object: "workspace-1",
      relation: "create_project",
      subject: "identity:user-1",
    });
    expect(checklistRepository.save).toHaveBeenCalledWith({
      itemId: "item-1",
      name: "Launch",
      createdById: "user-1",
    });
    expect(result).toEqual({
      checklist,
      entries: [],
      completedCount: 0,
      totalCount: 0,
    });
  });

  it("defaults blank create names to Checklist", async () => {
    const checklistRepository = createChecklistRepository();
    const service = createService({ checklistRepository });

    await service.create({
      itemId: "item-1",
      name: "   ",
      identityId: "user-1",
    });

    expect(checklistRepository.save).toHaveBeenCalledWith({
      itemId: "item-1",
      name: "Checklist",
      createdById: "user-1",
    });
  });

  it("rejects checklist names longer than 500 characters", async () => {
    const service = createService();

    await expect(
      service.create({
        itemId: "item-1",
        name: "x".repeat(501),
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ChecklistValidationError);
  });

  it("rejects empty rename names", async () => {
    const service = createService();

    await expect(
      service.update({
        id: "checklist-1",
        name: "   ",
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ChecklistValidationError);
  });

  it("updates a checklist and reloads entries with counts", async () => {
    const renamed = { ...checklist, name: "Renamed" };
    const checklistRepository = createChecklistRepository({
      update: vi.fn().mockResolvedValue(renamed),
    });
    const checklistEntryRepository = createChecklistEntryRepository();
    const service = createService({ checklistRepository, checklistEntryRepository });

    const result = await service.update({
      id: "checklist-1",
      name: "Renamed",
      identityId: "user-1",
    });

    expect(result).toEqual({
      checklist: renamed,
      entries: [entryA, entryB],
      completedCount: 1,
      totalCount: 2,
    });
  });

  it("soft-deletes a checklist and its entries in a transaction", async () => {
    const db = createDb();
    const checklistRepository = createChecklistRepository();
    const checklistEntryRepository = createChecklistEntryRepository();
    const service = createService({
      db,
      checklistRepository,
      checklistEntryRepository,
    });

    await service.delete({ id: "checklist-1", identityId: "user-1" });

    expect(db.transaction).toHaveBeenCalled();
    expect(checklistRepository.softDelete).toHaveBeenCalledWith("checklist-1", {
      tx: {},
    });
    expect(checklistEntryRepository.softDeleteByChecklistId).toHaveBeenCalledWith(
      "checklist-1",
      { tx: {} },
    );
  });

  it("creates an entry with the next order index", async () => {
    const checklistEntryRepository = createChecklistEntryRepository({
      findMaxOrderIndex: vi.fn().mockResolvedValue(1),
      save: vi.fn().mockResolvedValue({ ...entryA, id: "entry-c", orderIndex: 2 }),
    });
    const service = createService({ checklistEntryRepository });

    await service.createEntry({
      checklistId: "checklist-1",
      title: "  New entry  ",
      identityId: "user-1",
    });

    expect(checklistEntryRepository.save).toHaveBeenCalledWith({
      checklistId: "checklist-1",
      title: "New entry",
      orderIndex: 2,
      createdById: "user-1",
    });
  });

  it("rejects entry titles longer than 500 characters", async () => {
    const service = createService();

    await expect(
      service.createEntry({
        checklistId: "checklist-1",
        title: "y".repeat(501),
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ChecklistValidationError);
  });

  it("toggles entry completed after authorizing create_project", async () => {
    const authorizationClient = createAuthorizationClient();
    const checklistEntryRepository = createChecklistEntryRepository({
      update: vi.fn().mockResolvedValue({ ...entryA, completed: true }),
    });
    const service = createService({ authorizationClient, checklistEntryRepository });

    const result = await service.updateEntry({
      id: "entry-a",
      completed: true,
      identityId: "user-1",
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "workspace",
      object: "workspace-1",
      relation: "create_project",
      subject: "identity:user-1",
    });
    expect(checklistEntryRepository.update).toHaveBeenCalledWith("entry-a", {
      completed: true,
    });
    expect(result.completed).toBe(true);
  });

  it("rejects reorder when ids are not a full permutation", async () => {
    const service = createService();

    await expect(
      service.reorderEntries({
        checklistId: "checklist-1",
        ids: ["entry-a"],
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ChecklistReorderError);
  });

  it("reorders entries inside a transaction when ids match", async () => {
    const db = createDb();
    const checklistEntryRepository = createChecklistEntryRepository({
      findByChecklistId: vi
        .fn()
        .mockResolvedValueOnce([entryA, entryB])
        .mockResolvedValueOnce([entryB, entryA]),
    });
    const service = createService({ db, checklistEntryRepository });

    const result = await service.reorderEntries({
      checklistId: "checklist-1",
      ids: ["entry-b", "entry-a"],
      identityId: "user-1",
    });

    expect(checklistEntryRepository.replaceOrderIndexes).toHaveBeenCalledWith(
      ["entry-b", "entry-a"],
      { tx: {} },
    );
    expect(result).toEqual([entryB, entryA]);
  });

  it("throws ItemNotFoundError when the item is missing", async () => {
    const itemRepository = createItemRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const authorizationClient = createAuthorizationClient();
    const service = createService({ itemRepository, authorizationClient });

    await expect(
      service.list({ itemId: "missing", identityId: "user-1" }),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
    expect(authorizationClient.checkRelationship).not.toHaveBeenCalled();
  });

  it("throws ChecklistNotFoundError when updating a missing checklist", async () => {
    const checklistRepository = createChecklistRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const service = createService({ checklistRepository });

    await expect(
      service.update({
        id: "missing",
        name: "Nope",
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ChecklistNotFoundError);
  });

  it("throws ChecklistEntryNotFoundError when deleting a missing entry", async () => {
    const checklistEntryRepository = createChecklistEntryRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const service = createService({ checklistEntryRepository });

    await expect(
      service.deleteEntry({ id: "missing", identityId: "user-1" }),
    ).rejects.toBeInstanceOf(ChecklistEntryNotFoundError);
  });

  it("throws InsufficientPermissionError when authz denies access", async () => {
    const authorizationClient = createAuthorizationClient({
      checkRelationship: vi.fn().mockResolvedValue(false),
    });
    const service = createService({ authorizationClient });

    await expect(
      service.list({ itemId: "item-1", identityId: "user-1" }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
  });
});
