import { uuidv7 } from "@pine/common";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type StatusOption, StatusOptions } from "@/db";
import type {
  CreateStatusEntity,
  IStatusRepository,
  StatusRepositoryOptions,
  UpdateStatusEntity,
} from "./IStatusRepository";

@injectable()
export class StatusRepository implements IStatusRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(entity: CreateStatusEntity, options?: StatusRepositoryOptions): Promise<StatusOption> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(StatusOptions)
      .values({
        id: entity.id ?? uuidv7(),
        name: entity.name,
        type: entity.type,
        color: entity.color,
        orderIndex: entity.orderIndex,
        listId: entity.listId,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async saveMany(
    entities: CreateStatusEntity[],
    options?: StatusRepositoryOptions,
  ): Promise<StatusOption[]> {
    if (entities.length === 0) return [];

    const client = this.client(options);
    const now = new Date();

    return client
      .insert(StatusOptions)
      .values(
        entities.map((entity) => ({
          id: entity.id ?? uuidv7(),
          name: entity.name,
          type: entity.type,
          color: entity.color,
          orderIndex: entity.orderIndex,
          listId: entity.listId,
          createdAt: now,
          version: 1,
        })),
      )
      .returning();
  }

  async update(
    id: string,
    entity: UpdateStatusEntity,
    options?: StatusRepositoryOptions,
  ): Promise<StatusOption | null> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(StatusOptions)
      .set({
        ...(entity.name !== undefined ? { name: entity.name } : {}),
        ...(entity.type !== undefined ? { type: entity.type } : {}),
        ...(entity.color !== undefined ? { color: entity.color } : {}),
        ...(entity.orderIndex !== undefined ? { orderIndex: entity.orderIndex } : {}),
        updatedAt: now,
        version: sql`${StatusOptions.version} + 1`,
      })
      .where(and(eq(StatusOptions.id, id), isNull(StatusOptions.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async findById(id: string, options?: StatusRepositoryOptions): Promise<StatusOption | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(StatusOptions)
      .where(and(eq(StatusOptions.id, id), isNull(StatusOptions.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByListId(listId: string, options?: StatusRepositoryOptions): Promise<StatusOption[]> {
    const client = this.client(options);
    return client
      .select()
      .from(StatusOptions)
      .where(and(eq(StatusOptions.listId, listId), isNull(StatusOptions.deletedAt)))
      .orderBy(asc(StatusOptions.orderIndex));
  }

  async findMaxOrderIndex(
    listId: string,
    options?: StatusRepositoryOptions,
  ): Promise<number | null> {
    const client = this.client(options);
    const [row] = await client
      .select({ orderIndex: StatusOptions.orderIndex })
      .from(StatusOptions)
      .where(and(eq(StatusOptions.listId, listId), isNull(StatusOptions.deletedAt)))
      .orderBy(desc(StatusOptions.orderIndex))
      .limit(1);

    return row?.orderIndex ?? null;
  }

  async softDelete(id: string, options?: StatusRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(StatusOptions)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${StatusOptions.version} + 1`,
      })
      .where(and(eq(StatusOptions.id, id), isNull(StatusOptions.deletedAt)))
      .returning({ id: StatusOptions.id });

    return deleted.length > 0;
  }

  async replaceOrderIndexes(
    orderedIds: string[],
    options?: StatusRepositoryOptions,
  ): Promise<void> {
    const client = this.client(options);
    const now = new Date();

    await Promise.all(
      orderedIds.map((id, index) =>
        client
          .update(StatusOptions)
          .set({
            orderIndex: index,
            updatedAt: now,
            version: sql`${StatusOptions.version} + 1`,
          })
          .where(and(eq(StatusOptions.id, id), isNull(StatusOptions.deletedAt))),
      ),
    );
  }

  private client(options?: StatusRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
