import type { ItemPriority } from "@pine/common";
import type { DbClient, Item, Project } from "@/db";

export type ItemRepositoryOptions = { tx?: DbClient };

export type CreateItemEntity = {
  id?: string;
  name: string;
  description?: string | null;
  type: string;
  statusId: string;
  priority: ItemPriority | string;
  projectId: string;
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

export type ItemWithProject = Item & {
  project: Project;
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
  ): Promise<ItemWithProject | null>;
  findRootsByProject(
    projectId: string,
    userId: string,
    options?: ItemRepositoryOptions,
  ): Promise<ItemWithHasChildren[]>;
  findChildren(
    parentItemId: string,
    userId: string,
    options?: ItemRepositoryOptions,
  ): Promise<Item[]>;
}
