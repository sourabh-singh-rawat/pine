import type { DbClient, Item } from "@/db";

export type ItemRepositoryOptions = { tx?: DbClient };

export type UpsertItemEntity = {
  id: string;
  name: string;
  type: string;
  projectId: string;
  createdById: string;
  priority?: string | null;
  updatedById?: string | null;
};

export interface IItemRepository {
  upsert: (entity: UpsertItemEntity, options?: ItemRepositoryOptions) => Promise<Item>;
  findById: (id: string, options?: ItemRepositoryOptions) => Promise<Item | null>;
}
