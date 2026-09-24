import { uuidv7 } from "@pine/common";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type List, Lists } from "@/db";
import type {
  CreateListEntity,
  IListRepository,
  ListRepositoryOptions,
  UpdateListEntity,
} from "@/features/lists/repositories/IListRepository";

@injectable()
export class ListRepository implements IListRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(entity: CreateListEntity, options?: ListRepositoryOptions): Promise<List> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Lists)
      .values({
        id: entity.id ?? uuidv7(),
        spaceId: entity.spaceId,
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
    entity: UpdateListEntity,
    options?: ListRepositoryOptions,
  ): Promise<List> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(Lists)
      .set({
        ...(entity.name !== undefined ? { name: entity.name } : {}),
        updatedAt: now,
        version: sql`${Lists.version} + 1`,
      })
      .where(and(eq(Lists.id, id), isNull(Lists.deletedAt)))
      .returning();

    if (!updated) {
      throw new Error(`List not found for update: ${id}`);
    }

    return updated;
  }

  async findById(id: string, options?: ListRepositoryOptions): Promise<List | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Lists)
      .where(and(eq(Lists.id, id), isNull(Lists.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findBySpaceId(
    spaceId: string,
    page?: number | null,
    pageSize?: number | null,
    options?: ListRepositoryOptions,
  ): Promise<{ rows: List[]; rowCount: number }> {
    const client = this.client(options);
    const where = and(eq(Lists.spaceId, spaceId), isNull(Lists.deletedAt));

    const [countRow] = await client.select({ value: count() }).from(Lists).where(where);
    const rowCount = Number(countRow?.value ?? 0);

    let query = client.select().from(Lists).where(where).$dynamic();

    if (page != null && pageSize != null) {
      query = query.offset(page).limit(pageSize);
    }

    const rows = await query;
    return { rows, rowCount };
  }

  private client(options?: ListRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
