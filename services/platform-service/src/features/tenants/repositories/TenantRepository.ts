import { uuidv7 } from "@pine/common";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Tenant, Tenants } from "@/db";
import type {
  CreateTenantEntity,
  ITenantRepository,
  TenantRepositoryOptions,
} from "@/features/tenants/repositories/ITenantRepository";

@injectable()
export class TenantRepository implements ITenantRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  private client(options?: TenantRepositoryOptions) {
    return options?.tx ?? this.db;
  }

  async save(entity: CreateTenantEntity, options?: TenantRepositoryOptions): Promise<Tenant> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Tenants)
      .values({
        id: uuidv7(),
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

  async findById(id: string): Promise<Tenant | null> {
    const [row] = await this.db
      .select()
      .from(Tenants)
      .where(and(eq(Tenants.id, id), isNull(Tenants.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByIds(ids: string[]): Promise<Tenant[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.db
      .select()
      .from(Tenants)
      .where(and(inArray(Tenants.id, ids), isNull(Tenants.deletedAt)))
      .orderBy(desc(Tenants.createdAt));
  }

  async findBySlug(slug: string, options?: TenantRepositoryOptions): Promise<Tenant | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Tenants)
      .where(and(eq(Tenants.slug, slug), isNull(Tenants.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const row = await this.db
      .select({ id: Tenants.id })
      .from(Tenants)
      .where(and(eq(Tenants.slug, slug), isNull(Tenants.deletedAt)))
      .limit(1);

    return row.length > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const row = await this.db
      .select({ id: Tenants.id })
      .from(Tenants)
      .where(and(eq(Tenants.name, name), isNull(Tenants.deletedAt)))
      .limit(1);

    return row.length > 0;
  }

  async findAll(): Promise<Tenant[]> {
    return this.db
      .select()
      .from(Tenants)
      .where(isNull(Tenants.deletedAt))
      .orderBy(desc(Tenants.createdAt));
  }

  async softDelete(id: string, options?: TenantRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(Tenants)
      .set({
        deletedAt: now,
        updatedAt: now,
        slug: sql`${Tenants.id}::text`,
        version: sql`${Tenants.version} + 1`,
      })
      .where(and(eq(Tenants.id, id), isNull(Tenants.deletedAt)))
      .returning({ id: Tenants.id });

    return deleted.length > 0;
  }
}
