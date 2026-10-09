import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { ITEM_PRIORITY } from "@pine/common";
import { describe, expect, it, vi } from "vitest";
import type { Item } from "@/db";
import { ItemNotFoundError } from "@/features/item/errors";
import type { IItemRepository } from "@/features/item/repositories";
import { SubItemService } from "@/features/sub-items/services/SubItemService";

const parentItem: Item = {
  id: "parent-1",
  name: "Parent",
  description: null,
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
  orderIndex: 0,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const childItem: Item = {
  ...parentItem,
  id: "child-1",
  name: "Child",
  parentItemId: "parent-1",
};

const createItemRepository = (overrides: Partial<IItemRepository> = {}): IItemRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  findById: vi.fn().mockResolvedValue(parentItem),
  findByIdWithList: vi.fn(),
  findRootsByList: vi.fn(),
  findRootsByStatus: vi.fn(),
  findRootPageByStatus: vi.fn(),
  findRootFirstPagesByList: vi.fn(),
  countRootsByListGrouped: vi.fn(),
  findChildren: vi.fn().mockResolvedValue([childItem]),
  findMaxOrderIndex: vi.fn(),
  replaceOrderIndexes: vi.fn(),
  countByStatusId: vi.fn().mockResolvedValue(0),
  reassignStatus: vi.fn().mockResolvedValue(0),
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

const createService = (
  deps: {
    itemRepository?: IItemRepository;
    authorizationClient?: IAuthorizationClient;
  } = {},
) =>
  new SubItemService(
    deps.itemRepository ?? createItemRepository(),
    deps.authorizationClient ?? createAuthorizationClient(),
  );

describe("SubItemService.list", () => {
  it("returns children after authorizing list:read on the parent list", async () => {
    const itemRepository = createItemRepository();
    const authorizationClient = createAuthorizationClient();
    const service = createService({ itemRepository, authorizationClient });

    const result = await service.list({
      identityId: "user-2",
      parentItemId: "parent-1",
    });

    expect(result).toEqual([childItem]);
    expect(itemRepository.findById).toHaveBeenCalledWith("parent-1");
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "List",
      object: "list-1",
      relation: "read",
      subject: "Identity:user-2",
    });
    expect(itemRepository.findChildren).toHaveBeenCalledWith("parent-1");
  });

  it("throws when the parent is missing", async () => {
    const authorizationClient = createAuthorizationClient();
    const service = createService({
      itemRepository: createItemRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
      authorizationClient,
    });

    await expect(
      service.list({ identityId: "user-1", parentItemId: "missing" }),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
    expect(authorizationClient.checkRelationship).not.toHaveBeenCalled();
  });

  it("throws InsufficientPermissionError when list:read is denied", async () => {
    const itemRepository = createItemRepository();
    const authorizationClient = createAuthorizationClient({
      checkRelationship: vi.fn().mockResolvedValue(false),
    });
    const service = createService({ itemRepository, authorizationClient });

    await expect(
      service.list({ identityId: "user-1", parentItemId: "parent-1" }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
    expect(itemRepository.findChildren).not.toHaveBeenCalled();
  });
});
