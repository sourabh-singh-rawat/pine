import { eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Item, Items } from "@/db";
import type {
  IItemRepository,
  ItemRepositoryOptions,
  UpsertItemEntity,
} from "@/features/items/repositories/IItemRepository";

@injectable()
export class ItemRepository implements IItemRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  upsert = async (entity: UpsertItemEntity, options?: ItemRepositoryOptions): Promise<Item> => {
    const client = options?.tx ?? this.db;
    const now = new Date();

    const [inserted] = await client
      .insert(Items)
      .values({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        listId: entity.listId,
        createdById: entity.createdById,
        priority: entity.priority ?? null,
        updatedById: entity.updatedById ?? null,
        createdAt: now,
        version: 1,
      })
      .onConflictDoNothing({ target: Items.id })
      .returning();

    if (inserted) {
      return inserted;
    }

    const [updated] = await client
      .update(Items)
      .set({
        name: entity.name,
        type: entity.type,
        listId: entity.listId,
        ...(entity.priority !== undefined ? { priority: entity.priority } : {}),
        ...(entity.updatedById !== undefined ? { updatedById: entity.updatedById } : {}),
        updatedAt: now,
        version: sql`${Items.version} + 1`,
      })
      .where(eq(Items.id, entity.id))
      .returning();

    return updated;
  };

  findById = async (id: string, options?: ItemRepositoryOptions): Promise<Item | null> => {
    const client = options?.tx ?? this.db;
    const [row] = await client.select().from(Items).where(eq(Items.id, id)).limit(1);

    return row ?? null;
  };
}
