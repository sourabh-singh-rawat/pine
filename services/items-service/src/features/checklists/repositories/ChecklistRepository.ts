import { uuidv7 } from "@pine/common";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Checklist, ChecklistEntries, Checklists, type Database } from "@/db";
import type {
  ChecklistRepositoryOptions,
  ChecklistSummary,
  CreateChecklistEntity,
  IChecklistRepository,
  UpdateChecklistEntity,
} from "./IChecklistRepository";

@injectable()
export class ChecklistRepository implements IChecklistRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateChecklistEntity,
    options?: ChecklistRepositoryOptions,
  ): Promise<Checklist> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Checklists)
      .values({
        id: entity.id ?? uuidv7(),
        itemId: entity.itemId,
        name: entity.name,
        createdById: entity.createdById,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async update(
    id: string,
    entity: UpdateChecklistEntity,
    options?: ChecklistRepositoryOptions,
  ): Promise<Checklist | null> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(Checklists)
      .set({
        name: entity.name,
        updatedAt: now,
        version: sql`${Checklists.version} + 1`,
      })
      .where(and(eq(Checklists.id, id), isNull(Checklists.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async findById(id: string, options?: ChecklistRepositoryOptions): Promise<Checklist | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Checklists)
      .where(and(eq(Checklists.id, id), isNull(Checklists.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByItemId(itemId: string, options?: ChecklistRepositoryOptions): Promise<Checklist[]> {
    const client = this.client(options);

    return client
      .select()
      .from(Checklists)
      .where(and(eq(Checklists.itemId, itemId), isNull(Checklists.deletedAt)))
      .orderBy(asc(Checklists.createdAt));
  }

  async findSummariesByItemIds(
    itemIds: string[],
    options?: ChecklistRepositoryOptions,
  ): Promise<ChecklistSummary[]> {
    if (itemIds.length === 0) {
      return [];
    }

    const client = this.client(options);
    const rows = await client
      .select({
        id: Checklists.id,
        itemId: Checklists.itemId,
        name: Checklists.name,
        createdById: Checklists.createdById,
        createdAt: Checklists.createdAt,
        totalCount: sql<number>`coalesce(count(${ChecklistEntries.id}), 0)::int`,
        completedCount: sql<number>`coalesce(count(*) filter (where ${ChecklistEntries.completed} = true), 0)::int`,
      })
      .from(Checklists)
      .leftJoin(
        ChecklistEntries,
        and(eq(ChecklistEntries.checklistId, Checklists.id), isNull(ChecklistEntries.deletedAt)),
      )
      .where(and(inArray(Checklists.itemId, itemIds), isNull(Checklists.deletedAt)))
      .groupBy(
        Checklists.id,
        Checklists.itemId,
        Checklists.name,
        Checklists.createdById,
        Checklists.createdAt,
      )
      .orderBy(asc(Checklists.createdAt));

    return rows.map((row) => ({
      id: row.id,
      itemId: row.itemId,
      name: row.name,
      createdById: row.createdById,
      createdAt: row.createdAt,
      totalCount: Number(row.totalCount),
      completedCount: Number(row.completedCount),
    }));
  }

  async softDelete(id: string, options?: ChecklistRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(Checklists)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${Checklists.version} + 1`,
      })
      .where(and(eq(Checklists.id, id), isNull(Checklists.deletedAt)))
      .returning({ id: Checklists.id });

    return deleted.length > 0;
  }

  private client(options?: ChecklistRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
