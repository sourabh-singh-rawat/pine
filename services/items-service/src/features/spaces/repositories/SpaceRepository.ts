import { uuidv7 } from "@pine/common";
import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Space, Spaces } from "@/db";
import type {
  CreateSpaceEntity,
  ISpaceRepository,
  ListSpacesFilter,
  SpaceRepositoryOptions,
} from "@/features/spaces/repositories/ISpaceRepository";

@injectable()
export class SpaceRepository implements ISpaceRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateSpaceEntity,
    options?: SpaceRepositoryOptions,
  ): Promise<Space> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Spaces)
      .values({
        id: entity.id ?? uuidv7(),
        workspaceId: entity.workspaceId,
        name: entity.name,
        createdById: entity.createdById,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async findById(
    id: string,
    options?: SpaceRepositoryOptions,
  ): Promise<Space | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Spaces)
      .where(and(eq(Spaces.id, id), isNull(Spaces.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findMany(
    filter: ListSpacesFilter,
    options?: SpaceRepositoryOptions,
  ): Promise<Space[]> {
    const client = this.client(options);
    return client
      .select()
      .from(Spaces)
      .where(
        and(eq(Spaces.workspaceId, filter.workspaceId), isNull(Spaces.deletedAt)),
      );
  }

  private client(options?: SpaceRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
