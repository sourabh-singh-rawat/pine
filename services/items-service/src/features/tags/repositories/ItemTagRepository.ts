import { uuidv7 } from "@pine/common";
import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type ItemTag, ItemTags, type Tag, Tags } from "@/db";
import type { IItemTagRepository, ItemTagRepositoryOptions } from "./IItemTagRepository";

@injectable()
export class ItemTagRepository implements IItemTagRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async findByItemId(itemId: string, options?: ItemTagRepositoryOptions): Promise<Tag[]> {
    const client = this.client(options);
    const rows = await client
      .select({ tag: Tags })
      .from(ItemTags)
      .innerJoin(Tags, eq(ItemTags.tagId, Tags.id))
      .where(and(eq(ItemTags.itemId, itemId), isNull(ItemTags.deletedAt), isNull(Tags.deletedAt)));

    return rows.map((row) => row.tag);
  }

  async saveMany(
    entities: { itemId: string; tagId: string }[],
    options?: ItemTagRepositoryOptions,
  ): Promise<ItemTag[]> {
    if (entities.length === 0) return [];
    const client = this.client(options);
    return client
      .insert(ItemTags)
      .values(
        entities.map((entity) => ({
          id: uuidv7(),
          itemId: entity.itemId,
          tagId: entity.tagId,
        })),
      )
      .returning();
  }

  async deleteByItemId(itemId: string, options?: ItemTagRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const deleted = await client
      .delete(ItemTags)
      .where(eq(ItemTags.itemId, itemId))
      .returning({ id: ItemTags.id });

    return deleted.length > 0;
  }

  async delete(
    itemId: string,
    tagId: string,
    options?: ItemTagRepositoryOptions,
  ): Promise<boolean> {
    const client = this.client(options);
    const deleted = await client
      .delete(ItemTags)
      .where(and(eq(ItemTags.itemId, itemId), eq(ItemTags.tagId, tagId)))
      .returning({ id: ItemTags.id });

    return deleted.length > 0;
  }

  private client(options?: ItemTagRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
