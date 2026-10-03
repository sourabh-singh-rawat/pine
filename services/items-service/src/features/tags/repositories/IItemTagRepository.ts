import type { DbClient, ItemTag, Tag } from "@/db";

export type ItemTagRepositoryOptions = {
  tx?: DbClient;
};

export interface IItemTagRepository {
  findByItemId: (itemId: string, options?: ItemTagRepositoryOptions) => Promise<Tag[]>;
  saveMany: (
    entities: { itemId: string; tagId: string }[],
    options?: ItemTagRepositoryOptions,
  ) => Promise<ItemTag[]>;
  deleteByItemId: (itemId: string, options?: ItemTagRepositoryOptions) => Promise<boolean>;
  delete: (itemId: string, tagId: string, options?: ItemTagRepositoryOptions) => Promise<boolean>;
}
