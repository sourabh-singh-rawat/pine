import { uuidv7 } from "@pine/common";
import { and, eq, isNull, or } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Tag, Tags } from "@/db";
import type {
  CreateTagEntity,
  FindTagsFilter,
  ITagRepository,
  TagRepositoryOptions,
  UpdateTagEntity,
} from "./ITagRepository";

@injectable()
export class TagRepository implements ITagRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async findById(id: string, options?: TagRepositoryOptions): Promise<Tag | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Tags)
      .where(and(eq(Tags.id, id), isNull(Tags.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findMany(filter: FindTagsFilter, options?: TagRepositoryOptions): Promise<Tag[]> {
    const client = this.client(options);
    const conditions = [eq(Tags.organizationId, filter.organizationId), isNull(Tags.deletedAt)];

    if (filter.spaceId !== undefined) {
      if (filter.spaceId === null) {
        conditions.push(isNull(Tags.spaceId));
      } else {
        const spaceCondition = or(isNull(Tags.spaceId), eq(Tags.spaceId, filter.spaceId));
        if (spaceCondition) {
          conditions.push(spaceCondition);
        }
      }
    }

    return client
      .select()
      .from(Tags)
      .where(and(...conditions));
  }

  async save(entity: CreateTagEntity, options?: TagRepositoryOptions): Promise<Tag> {
    const client = this.client(options);
    const [created] = await client
      .insert(Tags)
      .values({
        id: entity.id ?? uuidv7(),
        organizationId: entity.organizationId,
        spaceId: entity.spaceId ?? null,
        name: entity.name,
        color: entity.color ?? "#64748B",
        description: entity.description ?? null,
      })
      .returning();

    return created;
  }

  async update(id: string, entity: UpdateTagEntity, options?: TagRepositoryOptions): Promise<Tag> {
    const client = this.client(options);
    const now = new Date();
    const [updated] = await client
      .update(Tags)
      .set({
        ...(entity.name !== undefined ? { name: entity.name } : {}),
        ...(entity.color !== undefined ? { color: entity.color } : {}),
        ...(entity.description !== undefined ? { description: entity.description } : {}),
        updatedAt: now,
      })
      .where(and(eq(Tags.id, id), isNull(Tags.deletedAt)))
      .returning();

    if (!updated) {
      throw new Error(`Tag not found for update: ${id}`);
    }

    return updated;
  }

  async softDelete(id: string, options?: TagRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();
    const deleted = await client
      .update(Tags)
      .set({ deletedAt: now })
      .where(and(eq(Tags.id, id), isNull(Tags.deletedAt)))
      .returning({ id: Tags.id });

    return deleted.length > 0;
  }

  private client(options?: TagRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
