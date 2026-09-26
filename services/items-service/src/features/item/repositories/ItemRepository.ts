import { uuidv7 } from "@pine/common";
import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Item, Items, Lists } from "@/db";
import type {
  CreateItemEntity,
  IItemRepository,
  ItemRepositoryOptions,
  ItemWithHasChildren,
  ItemWithList,
  UpdateItemEntity,
} from "@/features/item/repositories/IItemRepository";

@injectable()
export class ItemRepository implements IItemRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(entity: CreateItemEntity, options?: ItemRepositoryOptions): Promise<Item> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Items)
      .values({
        id: entity.id ?? uuidv7(),
        name: entity.name,
        description: entity.description ?? null,
        type: entity.type,
        statusId: entity.statusId,
        priority: entity.priority,
        listId: entity.listId,
        createdById: entity.createdById,
        parentItemId: entity.parentItemId ?? null,
        dueDate: entity.dueDate ?? null,
        estimate: entity.estimate ?? null,
        component: entity.component ?? null,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async update(
    id: string,
    userId: string,
    entity: UpdateItemEntity,
    options?: ItemRepositoryOptions,
  ): Promise<Item> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(Items)
      .set({
        ...(entity.name !== undefined ? { name: entity.name } : {}),
        ...(entity.description !== undefined ? { description: entity.description } : {}),
        ...(entity.type !== undefined ? { type: entity.type } : {}),
        ...(entity.statusId !== undefined ? { statusId: entity.statusId } : {}),
        ...(entity.priority !== undefined ? { priority: entity.priority } : {}),
        ...(entity.dueDate !== undefined ? { dueDate: entity.dueDate } : {}),
        ...(entity.estimate !== undefined ? { estimate: entity.estimate } : {}),
        ...(entity.component !== undefined ? { component: entity.component } : {}),
        ...(entity.updatedById !== undefined ? { updatedById: entity.updatedById } : {}),
        updatedAt: now,
        version: sql`${Items.version} + 1`,
      })
      .where(and(eq(Items.id, id), eq(Items.createdById, userId), isNull(Items.deletedAt)))
      .returning();

    if (!updated) {
      throw new Error(`Item not found for update: ${id}`);
    }

    return updated;
  }

  async softDelete(id: string, options?: ItemRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(Items)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${Items.version} + 1`,
      })
      .where(and(eq(Items.id, id), isNull(Items.deletedAt)))
      .returning({ id: Items.id });

    return deleted.length > 0;
  }

  async findById(id: string, options?: ItemRepositoryOptions): Promise<Item | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Items)
      .where(and(eq(Items.id, id), isNull(Items.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByIdForUser(
    id: string,
    userId: string,
    options?: ItemRepositoryOptions,
  ): Promise<ItemWithList | null> {
    const client = this.client(options);
    const [row] = await client
      .select({
        item: Items,
        list: Lists,
      })
      .from(Items)
      .innerJoin(Lists, eq(Items.listId, Lists.id))
      .where(
        and(
          eq(Items.id, id),
          eq(Items.createdById, userId),
          isNull(Items.deletedAt),
          isNull(Lists.deletedAt),
        ),
      )
      .limit(1);

    if (!row) return null;

    return { ...row.item, list: row.list };
  }

  async findRootsByList(
    listId: string,
    userId: string,
    options?: ItemRepositoryOptions,
  ): Promise<ItemWithHasChildren[]> {
    const client = this.client(options);
    const roots = await client
      .select()
      .from(Items)
      .where(
        and(
          eq(Items.listId, listId),
          eq(Items.createdById, userId),
          isNull(Items.parentItemId),
          isNull(Items.deletedAt),
        ),
      );

    if (roots.length === 0) {
      return [];
    }

    const rootIds = roots.map((root) => root.id);
    const childParents = await client
      .selectDistinct({ parentItemId: Items.parentItemId })
      .from(Items)
      .where(
        and(
          inArray(Items.parentItemId, rootIds),
          eq(Items.createdById, userId),
          isNull(Items.deletedAt),
        ),
      );

    const parentsWithChildren = new Set(
      childParents.flatMap((row) => (row.parentItemId ? [row.parentItemId] : [])),
    );

    return roots.map((root) => ({
      ...root,
      hasChildren: parentsWithChildren.has(root.id),
    }));
  }

  async findChildren(
    parentItemId: string,
    userId: string,
    options?: ItemRepositoryOptions,
  ): Promise<Item[]> {
    const client = this.client(options);
    return client
      .select()
      .from(Items)
      .where(
        and(
          eq(Items.parentItemId, parentItemId),
          eq(Items.createdById, userId),
          isNull(Items.deletedAt),
        ),
      );
  }

  async countByStatusId(statusId: string, options?: ItemRepositoryOptions): Promise<number> {
    const client = this.client(options);
    const [row] = await client
      .select({ value: count() })
      .from(Items)
      .where(and(eq(Items.statusId, statusId), isNull(Items.deletedAt)));

    return row?.value ?? 0;
  }

  async reassignStatus(
    fromStatusId: string,
    toStatusId: string,
    options?: ItemRepositoryOptions,
  ): Promise<number> {
    const client = this.client(options);
    const now = new Date();

    const updated = await client
      .update(Items)
      .set({
        statusId: toStatusId,
        updatedAt: now,
        version: sql`${Items.version} + 1`,
      })
      .where(and(eq(Items.statusId, fromStatusId), isNull(Items.deletedAt)))
      .returning({ id: Items.id });

    return updated.length;
  }

  private client(options?: ItemRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
