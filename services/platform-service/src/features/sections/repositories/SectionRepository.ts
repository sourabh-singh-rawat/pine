import { uuidv7 } from "@pine/common";
import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Section, Sections } from "@/db";
import type {
  CreateSectionEntity,
  ISectionRepository,
  SectionRepositoryOptions,
  UpdateSectionEntity,
} from "@/features/sections/repositories/ISectionRepository";

@injectable()
export class SectionRepository implements ISectionRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async saveSection(
    entity: CreateSectionEntity,
    options?: SectionRepositoryOptions,
  ): Promise<Section> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Sections)
      .values({
        id: uuidv7(),
        tenantId: entity.tenantId,
        organizationId: entity.organizationId,
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

  async findSectionById(id: string, options?: SectionRepositoryOptions): Promise<Section | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Sections)
      .where(and(eq(Sections.id, id), isNull(Sections.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async listSectionsByOrganizationId(
    organizationId: string,
    options?: SectionRepositoryOptions,
  ): Promise<Section[]> {
    const client = this.client(options);
    return client
      .select()
      .from(Sections)
      .where(and(eq(Sections.organizationId, organizationId), isNull(Sections.deletedAt)))
      .orderBy(asc(Sections.name));
  }

  async existsSectionBySlugInOrganization(
    organizationId: string,
    slug: string,
    excludeId?: string,
    options?: SectionRepositoryOptions,
  ): Promise<boolean> {
    const client = this.client(options);
    const conditions = [
      eq(Sections.organizationId, organizationId),
      eq(Sections.slug, slug),
      isNull(Sections.deletedAt),
    ];
    if (excludeId) {
      conditions.push(ne(Sections.id, excludeId));
    }

    const row = await client
      .select({ id: Sections.id })
      .from(Sections)
      .where(and(...conditions))
      .limit(1);

    return row.length > 0;
  }

  async existsSectionByNameInOrganization(
    organizationId: string,
    name: string,
    excludeId?: string,
    options?: SectionRepositoryOptions,
  ): Promise<boolean> {
    const client = this.client(options);
    const conditions = [
      eq(Sections.organizationId, organizationId),
      eq(Sections.name, name),
      isNull(Sections.deletedAt),
    ];
    if (excludeId) {
      conditions.push(ne(Sections.id, excludeId));
    }

    const row = await client
      .select({ id: Sections.id })
      .from(Sections)
      .where(and(...conditions))
      .limit(1);

    return row.length > 0;
  }

  async updateSection(
    id: string,
    entity: UpdateSectionEntity,
    options?: SectionRepositoryOptions,
  ): Promise<Section | null> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(Sections)
      .set({
        ...(entity.name !== undefined ? { name: entity.name } : {}),
        ...(entity.slug !== undefined ? { slug: entity.slug } : {}),
        ...(entity.description !== undefined ? { description: entity.description } : {}),
        ...(entity.isActive !== undefined ? { isActive: entity.isActive } : {}),
        updatedAt: now,
        version: sql`${Sections.version} + 1`,
      })
      .where(and(eq(Sections.id, id), isNull(Sections.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async softDeleteSection(id: string, options?: SectionRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(Sections)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${Sections.version} + 1`,
      })
      .where(and(eq(Sections.id, id), isNull(Sections.deletedAt)))
      .returning({ id: Sections.id });

    return deleted.length > 0;
  }

  private client(options?: SectionRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
