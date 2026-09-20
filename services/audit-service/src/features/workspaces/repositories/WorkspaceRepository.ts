import { eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Workspace, Workspaces } from "@/db";
import type {
  IWorkspaceRepository,
  WorkspaceRepositoryOptions,
  UpsertWorkspaceEntity,
} from "@/features/workspaces/repositories/IWorkspaceRepository";

@injectable()
export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  upsert = async (
    entity: UpsertWorkspaceEntity,
    options?: WorkspaceRepositoryOptions,
  ): Promise<Workspace> => {
    const client = options?.tx ?? this.db;
    const now = new Date();

    const [inserted] = await client
      .insert(Workspaces)
      .values({
        id: entity.id,
        tenantId: entity.tenantId,
        name: entity.name,
        slug: entity.slug,
        createdAt: now,
        version: 1,
      })
      .onConflictDoNothing({ target: Workspaces.id })
      .returning();

    if (inserted) {
      return inserted;
    }

    const [updated] = await client
      .update(Workspaces)
      .set({
        name: entity.name,
        slug: entity.slug,
        updatedAt: now,
        version: sql`${Workspaces.version} + 1`,
      })
      .where(eq(Workspaces.id, entity.id))
      .returning();

    return updated;
  };

  findById = async (
    id: string,
    options?: WorkspaceRepositoryOptions,
  ): Promise<Workspace | null> => {
    const client = options?.tx ?? this.db;
    const [row] = await client.select().from(Workspaces).where(eq(Workspaces.id, id)).limit(1);

    return row ?? null;
  };
}
