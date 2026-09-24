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
};

export type ItemWithList = Item & {
  list: List;
};

export type ItemWithHasChildren = Item & {
  hasChildren: boolean;
};

export interface IItemRepository {
  save(entity: CreateItemEntity, options?: ItemRepositoryOptions): Promise<Item>;
  update(
    id: string,
    userId: string,
    entity: UpdateItemEntity,
    options?: ItemRepositoryOptions,
  ): Promise<Item>;
  softDelete(id: string, options?: ItemRepositoryOptions): Promise<boolean>;
  findById(id: string, options?: ItemRepositoryOptions): Promise<Item | null>;
  findByIdForUser(
    id: string,
    userId: string,
    options?: ItemRepositoryOptions,
  ): Promise<ItemWithList | null>;
  findRootsByList(
    listId: string,
    userId: string,
    options?: ItemRepositoryOptions,
  ): Promise<ItemWithHasChildren[]>;
  findChildren(
    parentItemId: string,
    userId: string,
    options?: ItemRepositoryOptions,
  ): Promise<Item[]>;
}
