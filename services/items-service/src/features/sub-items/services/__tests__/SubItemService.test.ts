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

const createItemRepository = (
  overrides: Partial<IItemRepository> = {},
): IItemRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  findById: vi.fn().mockResolvedValue(parentItem),
  findByIdForUser: vi.fn(),
  findRootsByList: vi.fn(),
  findChildren: vi.fn().mockResolvedValue([childItem]),
  ...overrides,
});

const createService = (deps: { itemRepository?: IItemRepository } = {}) =>
  new SubItemService(deps.itemRepository ?? createItemRepository());

describe("SubItemService.list", () => {
  it("returns children for an owned parent", async () => {
    const itemRepository = createItemRepository();
    const service = createService({ itemRepository });

    const result = await service.list({
      userId: "user-1",
      parentItemId: "parent-1",
    });

    expect(result).toEqual([childItem]);
    expect(itemRepository.findById).toHaveBeenCalledWith("parent-1");
    expect(itemRepository.findChildren).toHaveBeenCalledWith("parent-1", "user-1");
  });

  it("throws when the parent is missing", async () => {
    const service = createService({
      itemRepository: createItemRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.list({ userId: "user-1", parentItemId: "missing" }),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
  });

  it("throws when the parent belongs to another user", async () => {
    const service = createService({
      itemRepository: createItemRepository({
        findById: vi.fn().mockResolvedValue({
          ...parentItem,
          createdById: "other-user",
        }),
      }),
    });

    await expect(
      service.list({ userId: "user-1", parentItemId: "parent-1" }),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
  });
});
