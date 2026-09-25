import { uuidv7 } from "@pine/common";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Workspace, Workspaces } from "@/db";
import type {
  CreateWorkspaceEntity,
  IWorkspaceRepository,
  ListWorkspacesFilter,
  WorkspaceRepositoryOptions,
  UpdateWorkspaceEntity,
} from "@/features/workspaces/repositories/IWorkspaceRepository";

@injectable()
export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateWorkspaceEntity,
    options?: WorkspaceRepositoryOptions,
  ): Promise<Workspace> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Workspaces)
      .values({
        id: uuidv7(),
        tenantId: entity.tenantId,
        parentWorkspaceId: entity.parentWorkspaceId ?? null,
        name: entity.name,
        slug: entity.slug,
        description: entity.description ?? null,
        isActive: entity.isActive ?? true,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async update(
    id: string,
    entity: UpdateWorkspaceEntity,
    options?: WorkspaceRepositoryOptions,
  ): Promise<Workspace | null> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(Workspaces)
      .set({
        ...(entity.parentWorkspaceId !== undefined
          ? { parentWorkspaceId: entity.parentWorkspaceId }
          : {}),
        updatedAt: now,
        version: sql`${Workspaces.version} + 1`,
      })
      .where(and(eq(Workspaces.id, id), isNull(Workspaces.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async findById(id: string): Promise<Workspace | null> {
    const [row] = await this.db
      .select()
      .from(Workspaces)
      .where(and(eq(Workspaces.id, id), isNull(Workspaces.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByIds(ids: string[]): Promise<Workspace[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.db
      .select()
      .from(Workspaces)
      .where(and(inArray(Workspaces.id, ids), isNull(Workspaces.deletedAt)))
      .orderBy(desc(Workspaces.createdAt));
  }

  async existsBySlugInTenant(tenantId: string, slug: string): Promise<boolean> {
    const row = await this.db
      .select({ id: Workspaces.id })
      .from(Workspaces)
      .where(
        and(
          eq(Workspaces.tenantId, tenantId),
          eq(Workspaces.slug, slug),
          isNull(Workspaces.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async existsByNameInTenant(tenantId: string, name: string): Promise<boolean> {
    const row = await this.db
      .select({ id: Workspaces.id })
      .from(Workspaces)
      .where(
        and(
          eq(Workspaces.tenantId, tenantId),
          eq(Workspaces.name, name),
          isNull(Workspaces.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async findMany(filter: ListWorkspacesFilter): Promise<Workspace[]> {
    const conditions = [eq(Workspaces.tenantId, filter.tenantId), isNull(Workspaces.deletedAt)];

    if (filter.parentWorkspaceId === null) {
      conditions.push(isNull(Workspaces.parentWorkspaceId));
    } else if (filter.parentWorkspaceId !== undefined) {
      conditions.push(eq(Workspaces.parentWorkspaceId, filter.parentWorkspaceId));
    }

    return this.db
      .select()
      .from(Workspaces)
      .where(and(...conditions))
      .orderBy(desc(Workspaces.createdAt));
  }

  async softDelete(id: string, options?: WorkspaceRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(Workspaces)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${Workspaces.version} + 1`,
      })
      .where(and(eq(Workspaces.id, id), isNull(Workspaces.deletedAt)))
      .returning({ id: Workspaces.id });

    return deleted.length > 0;
  }

  private client(options?: WorkspaceRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
