import type { ItemPriority } from "@pine/common";
import type { StatusOption } from "@/db";
import type { ChecklistCounts } from "@/features/checklists/repositories";
import type { Item } from "@/db";
import type { ItemWithHasChildren, ItemWithList } from "@/features/item/repositories";

export interface CreateItemOptions {
  identityId: string;
  listId: string;
  type: string;
  name: string;
  description?: string;
  dueDate?: Date;
  statusId?: string;
  priority?: ItemPriority;
  parentItemId?: string;
  estimate?: number;
  component?: string;
}

export interface GetItemOptions {
  identityId: string;
  itemId: string;
}

export interface UpdateItemOptions {
  identityId: string;
  itemId: string;
  type?: string;
  name?: string;
  statusId?: string;
  priority?: ItemPriority;
  description?: string;
  dueDate?: Date | null;
  estimate?: number;
  component?: string;
}

export interface ListItemsOptions {
  listId: string;
  identityId: string;
  first?: number | null;
  statusId?: string | null;
  after?: string | null;
}

export interface DeleteItemOptions {
  id: string;
  identityId: string;
}

export interface ReorderListItemsOptions {
  listId: string;
  statusId: string;
  itemIds: string[];
  identityId: string;
}

export type ItemListItem = ItemWithHasChildren & {
  checklistCounts: Pick<ChecklistCounts, "completedCount" | "totalCount">;
};

export type ItemGroupPageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export type ItemStatusGroup = {
  status: StatusOption;
  items: ItemListItem[];
  pageInfo: ItemGroupPageInfo;
  totalCount: number;
};

export interface IItemService {
  create(options: CreateItemOptions): Promise<string>;
  getById(options: GetItemOptions): Promise<ItemWithList | null>;
  list(options: ListItemsOptions): Promise<ItemStatusGroup[]>;
  update(options: UpdateItemOptions): Promise<void>;
  delete(options: DeleteItemOptions): Promise<void>;
  reorder(options: ReorderListItemsOptions): Promise<Item[]>;
}
