import { eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Space, Spaces } from "@/db";
import type {
  ISpaceRepository,
  SpaceRepositoryOptions,
  UpsertSpaceEntity,
} from "@/features/spaces/repositories/ISpaceRepository";

@injectable()
export class SpaceRepository implements ISpaceRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  upsert = async (entity: UpsertSpaceEntity, options?: SpaceRepositoryOptions): Promise<Space> => {
    const client = options?.tx ?? this.db;
    const now = new Date();

    const [inserted] = await client
      .insert(Spaces)
      .values({
        id: entity.id,
        workspaceId: entity.workspaceId,
        name: entity.name,
        createdById: entity.createdById,
        createdAt: now,
        version: 1,
      })
      .onConflictDoNothing({ target: Spaces.id })
      .returning();

    if (inserted) {
      return inserted;
    }

    const [updated] = await client
      .update(Spaces)
      .set({
        name: entity.name,
        updatedAt: now,
        version: sql`${Spaces.version} + 1`,
      })
      .where(eq(Spaces.id, entity.id))
      .returning();

    return updated;
  };

  findById = async (id: string, options?: SpaceRepositoryOptions): Promise<Space | null> => {
    const client = options?.tx ?? this.db;
    const [row] = await client.select().from(Spaces).where(eq(Spaces.id, id)).limit(1);

    return row ?? null;
  };
}
