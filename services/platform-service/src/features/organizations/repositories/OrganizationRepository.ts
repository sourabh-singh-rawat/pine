import { uuidv7 } from "@pine/common";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Organization, Organizations } from "@/db";
import type {
  CreateOrganizationEntity,
  IOrganizationRepository,
  ListOrganizationsFilter,
  OrganizationRepositoryOptions,
  UpdateOrganizationEntity,
} from "@/features/organizations/repositories/IOrganizationRepository";

@injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateOrganizationEntity,
    options?: OrganizationRepositoryOptions,
  ): Promise<Organization> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Organizations)
      .values({
        id: uuidv7(),
        tenantId: entity.tenantId,
        parentOrganizationId: entity.parentOrganizationId ?? null,
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
    entity: UpdateOrganizationEntity,
    options?: OrganizationRepositoryOptions,
  ): Promise<Organization | null> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(Organizations)
      .set({
        ...(entity.parentOrganizationId !== undefined
          ? { parentOrganizationId: entity.parentOrganizationId }
          : {}),
        updatedAt: now,
        version: sql`${Organizations.version} + 1`,
      })
      .where(and(eq(Organizations.id, id), isNull(Organizations.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async findById(id: string): Promise<Organization | null> {
    const [row] = await this.db
      .select()
      .from(Organizations)
      .where(and(eq(Organizations.id, id), isNull(Organizations.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByIds(ids: string[]): Promise<Organization[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.db
      .select()
      .from(Organizations)
      .where(and(inArray(Organizations.id, ids), isNull(Organizations.deletedAt)))
      .orderBy(desc(Organizations.createdAt));
  }

  async existsBySlugInTenant(tenantId: string, slug: string): Promise<boolean> {
    const row = await this.db
      .select({ id: Organizations.id })
      .from(Organizations)
      .where(
        and(
          eq(Organizations.tenantId, tenantId),
          eq(Organizations.slug, slug),
          isNull(Organizations.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async existsByNameInTenant(tenantId: string, name: string): Promise<boolean> {
    const row = await this.db
      .select({ id: Organizations.id })
      .from(Organizations)
      .where(
        and(
          eq(Organizations.tenantId, tenantId),
          eq(Organizations.name, name),
          isNull(Organizations.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async findMany(filter: ListOrganizationsFilter): Promise<Organization[]> {
    const conditions = [
      eq(Organizations.tenantId, filter.tenantId),
      isNull(Organizations.deletedAt),
    ];

    if (filter.parentOrganizationId === null) {
      conditions.push(isNull(Organizations.parentOrganizationId));
    } else if (filter.parentOrganizationId !== undefined) {
      conditions.push(eq(Organizations.parentOrganizationId, filter.parentOrganizationId));
    }

    return this.db
      .select()
      .from(Organizations)
      .where(and(...conditions))
      .orderBy(desc(Organizations.createdAt));
  }

  async softDelete(id: string, options?: OrganizationRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(Organizations)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${Organizations.version} + 1`,
      })
      .where(and(eq(Organizations.id, id), isNull(Organizations.deletedAt)))
      .returning({ id: Organizations.id });

    return deleted.length > 0;
  }

  private client(options?: OrganizationRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
