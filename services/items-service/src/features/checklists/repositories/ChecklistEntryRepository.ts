import { uuidv7 } from "@pine/common";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type ChecklistEntry, ChecklistEntries, type Database } from "@/db";
import type {
  ChecklistEntryRepositoryOptions,
  CreateChecklistEntryEntity,
  IChecklistEntryRepository,
  UpdateChecklistEntryEntity,
} from "./IChecklistEntryRepository";

@injectable()
export class ChecklistEntryRepository implements IChecklistEntryRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateChecklistEntryEntity,
    options?: ChecklistEntryRepositoryOptions,
  ): Promise<ChecklistEntry> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(ChecklistEntries)
      .values({
        id: entity.id ?? uuidv7(),
        checklistId: entity.checklistId,
        title: entity.title,
        completed: entity.completed ?? false,
        orderIndex: entity.orderIndex,
        createdById: entity.createdById,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async update(
    id: string,
    entity: UpdateChecklistEntryEntity,
    options?: ChecklistEntryRepositoryOptions,
  ): Promise<ChecklistEntry | null> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(ChecklistEntries)
      .set({
        ...(entity.title !== undefined ? { title: entity.title } : {}),
        ...(entity.completed !== undefined ? { completed: entity.completed } : {}),
        updatedAt: now,
        version: sql`${ChecklistEntries.version} + 1`,
      })
      .where(and(eq(ChecklistEntries.id, id), isNull(ChecklistEntries.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async findById(
    id: string,
    options?: ChecklistEntryRepositoryOptions,
  ): Promise<ChecklistEntry | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(ChecklistEntries)
      .where(and(eq(ChecklistEntries.id, id), isNull(ChecklistEntries.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByChecklistId(
    checklistId: string,
    options?: ChecklistEntryRepositoryOptions,
  ): Promise<ChecklistEntry[]> {
    const client = this.client(options);

    return client
      .select()
      .from(ChecklistEntries)
      .where(
        and(
          eq(ChecklistEntries.checklistId, checklistId),
          isNull(ChecklistEntries.deletedAt),
        ),
      )
      .orderBy(asc(ChecklistEntries.orderIndex));
  }

  async findByChecklistIds(
    checklistIds: string[],
    options?: ChecklistEntryRepositoryOptions,
  ): Promise<ChecklistEntry[]> {
    if (checklistIds.length === 0) {
      return [];
    }

    const client = this.client(options);

    return client
      .select()
      .from(ChecklistEntries)
      .where(
        and(
          inArray(ChecklistEntries.checklistId, checklistIds),
          isNull(ChecklistEntries.deletedAt),
        ),
      )
      .orderBy(asc(ChecklistEntries.orderIndex));
  }

  async findMaxOrderIndex(
    checklistId: string,
    options?: ChecklistEntryRepositoryOptions,
  ): Promise<number | null> {
    const client = this.client(options);
    const [row] = await client
      .select({ orderIndex: ChecklistEntries.orderIndex })
      .from(ChecklistEntries)
      .where(
        and(
          eq(ChecklistEntries.checklistId, checklistId),
          isNull(ChecklistEntries.deletedAt),
        ),
      )
      .orderBy(desc(ChecklistEntries.orderIndex))
      .limit(1);

    return row?.orderIndex ?? null;
  }

  async softDelete(
    id: string,
    options?: ChecklistEntryRepositoryOptions,
  ): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(ChecklistEntries)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${ChecklistEntries.version} + 1`,
      })
      .where(and(eq(ChecklistEntries.id, id), isNull(ChecklistEntries.deletedAt)))
      .returning({ id: ChecklistEntries.id });

    return deleted.length > 0;
  }

  async softDeleteByChecklistId(
    checklistId: string,
    options?: ChecklistEntryRepositoryOptions,
  ): Promise<number> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(ChecklistEntries)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${ChecklistEntries.version} + 1`,
      })
      .where(
        and(
          eq(ChecklistEntries.checklistId, checklistId),
          isNull(ChecklistEntries.deletedAt),
        ),
      )
      .returning({ id: ChecklistEntries.id });

    return deleted.length;
  }

  async replaceOrderIndexes(
    orderedIds: string[],
    options?: ChecklistEntryRepositoryOptions,
  ): Promise<void> {
    const client = this.client(options);
    const now = new Date();

    await Promise.all(
      orderedIds.map((id, index) =>
        client
          .update(ChecklistEntries)
          .set({
            orderIndex: index,
            updatedAt: now,
            version: sql`${ChecklistEntries.version} + 1`,
          })
          .where(and(eq(ChecklistEntries.id, id), isNull(ChecklistEntries.deletedAt))),
      ),
    );
  }

  private client(options?: ChecklistEntryRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
