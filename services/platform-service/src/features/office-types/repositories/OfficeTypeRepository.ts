import { uuidv7 } from "@pine/common";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type OrganizationOfficeType, OrganizationOfficeTypes } from "@/db";
import type {
  CreateOfficeTypeEntity,
  IOfficeTypeRepository,
  OfficeTypeRepositoryOptions,
} from "@/features/office-types/repositories/IOfficeTypeRepository";

@injectable()
export class OfficeTypeRepository implements IOfficeTypeRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateOfficeTypeEntity,
    options?: OfficeTypeRepositoryOptions,
  ): Promise<OrganizationOfficeType> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(OrganizationOfficeTypes)
      .values({
        id: uuidv7(),
        tenantId: entity.tenantId,
        parentOfficeTypeId: entity.parentOfficeTypeId ?? null,
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

  async findById(id: string): Promise<OrganizationOfficeType | null> {
    const [row] = await this.db
      .select()
      .from(OrganizationOfficeTypes)
      .where(and(eq(OrganizationOfficeTypes.id, id), isNull(OrganizationOfficeTypes.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findManyByTenant(tenantId: string): Promise<OrganizationOfficeType[]> {
    return this.db
      .select()
      .from(OrganizationOfficeTypes)
      .where(
        and(
          eq(OrganizationOfficeTypes.tenantId, tenantId),
          isNull(OrganizationOfficeTypes.deletedAt),
        ),
      )
      .orderBy(asc(OrganizationOfficeTypes.name));
  }

  async existsBySlugInTenant(tenantId: string, slug: string): Promise<boolean> {
    const row = await this.db
      .select({ id: OrganizationOfficeTypes.id })
      .from(OrganizationOfficeTypes)
      .where(
        and(
          eq(OrganizationOfficeTypes.tenantId, tenantId),
          eq(OrganizationOfficeTypes.slug, slug),
          isNull(OrganizationOfficeTypes.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async existsByNameInTenant(tenantId: string, name: string): Promise<boolean> {
    const row = await this.db
      .select({ id: OrganizationOfficeTypes.id })
      .from(OrganizationOfficeTypes)
      .where(
        and(
          eq(OrganizationOfficeTypes.tenantId, tenantId),
          eq(OrganizationOfficeTypes.name, name),
          isNull(OrganizationOfficeTypes.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async existsByParentOfficeTypeId(parentOfficeTypeId: string): Promise<boolean> {
    const row = await this.db
      .select({ id: OrganizationOfficeTypes.id })
      .from(OrganizationOfficeTypes)
      .where(
        and(
          eq(OrganizationOfficeTypes.parentOfficeTypeId, parentOfficeTypeId),
          isNull(OrganizationOfficeTypes.deletedAt),
        ),
      )
      .limit(1);

    return row.length > 0;
  }

  async softDelete(id: string, options?: OfficeTypeRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(OrganizationOfficeTypes)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${OrganizationOfficeTypes.version} + 1`,
      })
      .where(and(eq(OrganizationOfficeTypes.id, id), isNull(OrganizationOfficeTypes.deletedAt)))
      .returning({ id: OrganizationOfficeTypes.id });

    return deleted.length > 0;
  }

  private client(options?: OfficeTypeRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
