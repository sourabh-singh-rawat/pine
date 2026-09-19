import { uuidv7 } from "@pine/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Issue, Issues, Projects } from "@/db";
import type {
  CreateIssueEntity,
  IIssueRepository,
  IssueRepositoryOptions,
  IssueWithProject,
  UpdateIssueEntity,
} from "@/features/issue/repositories/IIssueRepository";

@injectable()
export class IssueRepository implements IIssueRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  private client(options?: IssueRepositoryOptions) {
    return options?.tx ?? this.db;
  }

  async save(entity: CreateIssueEntity, options?: IssueRepositoryOptions): Promise<Issue> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Issues)
      .values({
        id: entity.id ?? uuidv7(),
        name: entity.name,
        description: entity.description ?? null,
        type: entity.type,
        statusId: entity.statusId,
        priority: entity.priority,
        projectId: entity.projectId,
        createdById: entity.createdById,
        parentIssueId: entity.parentIssueId ?? null,
        dueDate: entity.dueDate ?? null,
        estimate: entity.estimate ?? null,
        component: entity.component ?? null,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async update(
    id: string,
    userId: string,
    entity: UpdateIssueEntity,
    options?: IssueRepositoryOptions,
  ): Promise<void> {
    const client = this.client(options);
    const now = new Date();

    await client
      .update(Issues)
      .set({
        ...(entity.name !== undefined ? { name: entity.name } : {}),
        ...(entity.description !== undefined ? { description: entity.description } : {}),
        ...(entity.type !== undefined ? { type: entity.type } : {}),
        ...(entity.statusId !== undefined ? { statusId: entity.statusId } : {}),
        ...(entity.priority !== undefined ? { priority: entity.priority } : {}),
        ...(entity.dueDate !== undefined ? { dueDate: entity.dueDate } : {}),
        ...(entity.estimate !== undefined ? { estimate: entity.estimate } : {}),
        ...(entity.component !== undefined ? { component: entity.component } : {}),
        ...(entity.updatedById !== undefined ? { updatedById: entity.updatedById } : {}),
        updatedAt: now,
        version: sql`${Issues.version} + 1`,
      })
      .where(and(eq(Issues.id, id), eq(Issues.createdById, userId), isNull(Issues.deletedAt)));
  }

  async softDelete(id: string, options?: IssueRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(Issues)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${Issues.version} + 1`,
      })
      .where(and(eq(Issues.id, id), isNull(Issues.deletedAt)))
      .returning({ id: Issues.id });

    return deleted.length > 0;
  }

  async findById(id: string, options?: IssueRepositoryOptions): Promise<Issue | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Issues)
      .where(and(eq(Issues.id, id), isNull(Issues.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByIdForUser(
    id: string,
    userId: string,
    options?: IssueRepositoryOptions,
  ): Promise<IssueWithProject | null> {
    const client = this.client(options);
    const [row] = await client
      .select({
        issue: Issues,
        project: Projects,
      })
      .from(Issues)
      .innerJoin(Projects, eq(Issues.projectId, Projects.id))
      .where(
        and(
          eq(Issues.id, id),
          eq(Issues.createdById, userId),
          isNull(Issues.deletedAt),
          isNull(Projects.deletedAt),
        ),
      )
      .limit(1);

    if (!row) return null;

    return { ...row.issue, project: row.project };
  }

  async findRootsByProject(
    projectId: string,
    userId: string,
    options?: IssueRepositoryOptions,
  ): Promise<Issue[]> {
    const client = this.client(options);
    return client
      .select()
      .from(Issues)
      .where(
        and(
          eq(Issues.projectId, projectId),
          eq(Issues.createdById, userId),
          isNull(Issues.parentIssueId),
          isNull(Issues.deletedAt),
        ),
      );
  }

  async findChildren(
    parentIssueId: string,
    userId: string,
    options?: IssueRepositoryOptions,
  ): Promise<Issue[]> {
    const client = this.client(options);
    return client
      .select()
      .from(Issues)
      .where(
        and(
          eq(Issues.parentIssueId, parentIssueId),
          eq(Issues.createdById, userId),
          isNull(Issues.deletedAt),
        ),
      );
  }
}
