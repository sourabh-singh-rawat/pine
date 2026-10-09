import { eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Organization, Organizations } from "@/db";
import type {
  IOrganizationRepository,
  OrganizationRepositoryOptions,
  UpsertOrganizationEntity,
} from "@/features/organizations/repositories/IOrganizationRepository";

@injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  upsert = async (
    entity: UpsertOrganizationEntity,
    options?: OrganizationRepositoryOptions,
  ): Promise<Organization> => {
    const client = options?.tx ?? this.db;
    const now = new Date();

    const [inserted] = await client
      .insert(Organizations)
      .values({
        id: entity.id,
        tenantId: entity.tenantId,
        name: entity.name,
        slug: entity.slug,
        createdAt: now,
        version: 1,
      })
      .onConflictDoNothing({ target: Organizations.id })
      .returning();

    if (inserted) {
      return inserted;
    }

    const [updated] = await client
      .update(Organizations)
      .set({
        name: entity.name,
        slug: entity.slug,
        updatedAt: now,
        version: sql`${Organizations.version} + 1`,
      })
      .where(eq(Organizations.id, entity.id))
      .returning();

    return updated;
  };

  findById = async (
    id: string,
    options?: OrganizationRepositoryOptions,
  ): Promise<Organization | null> => {
    const client = options?.tx ?? this.db;
    const [row] = await client
      .select()
      .from(Organizations)
      .where(eq(Organizations.id, id))
      .limit(1);

    return row ?? null;
  };
}
