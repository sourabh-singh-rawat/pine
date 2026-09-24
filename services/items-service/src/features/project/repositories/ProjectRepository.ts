import { uuidv7 } from "@pine/common";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Project, Projects } from "@/db";
import type {
  CreateProjectEntity,
  IProjectRepository,
  ProjectRepositoryOptions,
  UpdateProjectEntity,
} from "@/features/project/repositories/IProjectRepository";

@injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(entity: CreateProjectEntity, options?: ProjectRepositoryOptions): Promise<Project> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Projects)
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
    entity: UpdateProjectEntity,
    options?: ProjectRepositoryOptions,
  ): Promise<Project> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(Projects)
      .set({
        ...(entity.name !== undefined ? { name: entity.name } : {}),
        updatedAt: now,
        version: sql`${Projects.version} + 1`,
      })
      .where(and(eq(Projects.id, id), isNull(Projects.deletedAt)))
      .returning();

    if (!updated) {
      throw new Error(`Project not found for update: ${id}`);
    }

    return updated;
  }

  async findById(id: string, options?: ProjectRepositoryOptions): Promise<Project | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Projects)
      .where(and(eq(Projects.id, id), isNull(Projects.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findBySpaceId(
    spaceId: string,
    page?: number | null,
    pageSize?: number | null,
    options?: ProjectRepositoryOptions,
  ): Promise<{ rows: Project[]; rowCount: number }> {
    const client = this.client(options);
    const where = and(eq(Projects.spaceId, spaceId), isNull(Projects.deletedAt));

    const [countRow] = await client.select({ value: count() }).from(Projects).where(where);
    const rowCount = Number(countRow?.value ?? 0);

    let query = client.select().from(Projects).where(where).$dynamic();

    if (page != null && pageSize != null) {
      query = query.offset(page).limit(pageSize);
    }

    const rows = await query;
    return { rows, rowCount };
  }

  private client(options?: ProjectRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
