import type { ItemPriority } from "@pine/common";
import type { DbClient, Item, List } from "@/db";

export type ItemRepositoryOptions = { tx?: DbClient };

export type CreateItemEntity = {
  id?: string;
  name: string;
  description?: string | null;
  type: string;
  statusId: string;
  priority: ItemPriority | string;
  listId: string;
  createdById: string;
  parentItemId?: string | null;
  dueDate?: Date | null;
  estimate?: number | null;
  component?: string | null;
  orderIndex: number;
};

export type UpdateItemEntity = {
  name?: string;
  description?: string | null;
  type?: string;
  statusId?: string;
  priority?: ItemPriority | string;
  dueDate?: Date | null;
  estimate?: number | null;
  component?: string | null;
  updatedById?: string | null;
  orderIndex?: number;
};

export type ItemWithList = Item & {
  list: List;
};

export type ItemWithHasChildren = Item & {
  hasChildren: boolean;
};

export type RootPageCursor = {
  orderIndex: number;
  id: string;
};

export type FindRootPageByStatusOptions = {
  statusId: string;
  limit: number;
  after?: RootPageCursor;
};

export type RootCountByStatus = {
  statusId: string;
  totalCount: number;
};

export type FindMaxOrderIndexOptions = {
  listId: string;
  statusId: string;
  parentItemId?: string | null;
};

export interface IItemRepository {
  save(entity: CreateItemEntity, options?: ItemRepositoryOptions): Promise<Item>;
  update(id: string, entity: UpdateItemEntity, options?: ItemRepositoryOptions): Promise<Item>;
  softDelete(id: string, options?: ItemRepositoryOptions): Promise<boolean>;
  findById(id: string, options?: ItemRepositoryOptions): Promise<Item | null>;
  findByIdWithList(id: string, options?: ItemRepositoryOptions): Promise<ItemWithList | null>;
  findRootsByList(listId: string, options?: ItemRepositoryOptions): Promise<ItemWithHasChildren[]>;
  findRootsByStatus(
    listId: string,
    statusId: string,
    options?: ItemRepositoryOptions,
  ): Promise<Item[]>;
  findRootPageByStatus(
    listId: string,
    page: FindRootPageByStatusOptions,
    options?: ItemRepositoryOptions,
  ): Promise<ItemWithHasChildren[]>;
  findRootFirstPagesByList(
    listId: string,
    limit: number,
    options?: ItemRepositoryOptions,
  ): Promise<ItemWithHasChildren[]>;
  countRootsByListGrouped(
    listId: string,
    options?: ItemRepositoryOptions,
  ): Promise<RootCountByStatus[]>;
  findChildren(parentItemId: string, options?: ItemRepositoryOptions): Promise<Item[]>;
  findMaxOrderIndex(
    query: FindMaxOrderIndexOptions,
    options?: ItemRepositoryOptions,
  ): Promise<number | null>;
  replaceOrderIndexes(orderedIds: string[], options?: ItemRepositoryOptions): Promise<void>;
  countByStatusId: (statusId: string, options?: ItemRepositoryOptions) => Promise<number>;
  reassignStatus: (
    fromStatusId: string,
    toStatusId: string,
    options?: ItemRepositoryOptions,
  ) => Promise<number>;
}
