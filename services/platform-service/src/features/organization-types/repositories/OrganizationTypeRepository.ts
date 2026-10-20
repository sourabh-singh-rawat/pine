import { uuidv7 } from "@pine/common";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type OrganizationType, OrganizationTypes } from "@/db";
import type {
  CreateOrganizationTypeEntity,
  IOrganizationTypeRepository,
  OrganizationTypeRepositoryOptions,
} from "@/features/organization-types/repositories/IOrganizationTypeRepository";

@injectable()
export class OrganizationTypeRepository implements IOrganizationTypeRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateOrganizationTypeEntity,
    options?: OrganizationTypeRepositoryOptions,
  ): Promise<OrganizationType> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(OrganizationTypes)
      .values({
        id: uuidv7(),
        tenantId: entity.tenantId,
        parentOrganizationTypeId: entity.parentOrganizationTypeId ?? null,
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

  async findById(id: string): Promise<OrganizationType | null> {
    const [row] = await this.db
      .select()
      .from(OrganizationTypes)
      .where(and(eq(OrganizationTypes.id, id), isNull(OrganizationTypes.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findManyByTenant(tenantId: string): Promise<OrganizationType[]> {
    return this.db
      .select()
      .from(OrganizationTypes)
      .where(and(eq(OrganizationTypes.tenantId, tenantId), isNull(OrganizationTypes.deletedAt)))
      .orderBy(asc(OrganizationTypes.name));
  }

  async existsBySlugInTenant(tenantId: string, slug: string): Promise<boolean> {
    const row = await this.db
      .select({ id: OrganizationTypes.id })
      .from(OrganizationTypes)
      .where(
        and(
          eq(OrganizationTypes.tenantId, tenantId),
          eq(OrganizationTypes.slug, slug),
          isNull(OrganizationTypes.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async existsByNameInTenant(tenantId: string, name: string): Promise<boolean> {
    const row = await this.db
      .select({ id: OrganizationTypes.id })
      .from(OrganizationTypes)
      .where(
        and(
          eq(OrganizationTypes.tenantId, tenantId),
          eq(OrganizationTypes.name, name),
          isNull(OrganizationTypes.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async existsByParentOrganizationTypeId(parentOrganizationTypeId: string): Promise<boolean> {
    const row = await this.db
      .select({ id: OrganizationTypes.id })
      .from(OrganizationTypes)
      .where(
        and(
          eq(OrganizationTypes.parentOrganizationTypeId, parentOrganizationTypeId),
          isNull(OrganizationTypes.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async softDelete(id: string, options?: OrganizationTypeRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(OrganizationTypes)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${OrganizationTypes.version} + 1`,
      })
      .where(and(eq(OrganizationTypes.id, id), isNull(OrganizationTypes.deletedAt)))
      .returning({ id: OrganizationTypes.id });

    return deleted.length > 0;
  }

  private client(options?: OrganizationTypeRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
