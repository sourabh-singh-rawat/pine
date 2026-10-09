import { uuidv7 } from "@pine/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import {
  type Database,
  type IdentityOrganizationPreference,
  IdentityOrganizationPreferences,
} from "@/db";
import type {
  IOrganizationPreferenceRepository,
  OrganizationPreferenceRepositoryOptions,
  UpsertOrganizationPreferenceEntity,
} from "@/features/organizations/repositories/IOrganizationPreferenceRepository";

@injectable()
export class OrganizationPreferenceRepository implements IOrganizationPreferenceRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async findByIdentityId(
    identityId: string,
    options?: OrganizationPreferenceRepositoryOptions,
  ): Promise<IdentityOrganizationPreference | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(IdentityOrganizationPreferences)
      .where(
        and(
          eq(IdentityOrganizationPreferences.identityId, identityId),
          isNull(IdentityOrganizationPreferences.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async upsert(
    entity: UpsertOrganizationPreferenceEntity,
    options?: OrganizationPreferenceRepositoryOptions,
  ): Promise<IdentityOrganizationPreference> {
    const client = this.client(options);
    const now = new Date();
    const existing = await this.findByIdentityId(entity.identityId, options);

    if (existing) {
      const [updated] = await client
        .update(IdentityOrganizationPreferences)
        .set({
          organizationId: entity.organizationId,
          tenantId: entity.tenantId,
          updatedAt: now,
          version: sql`${IdentityOrganizationPreferences.version} + 1`,
        })
        .where(
          and(
            eq(IdentityOrganizationPreferences.id, existing.id),
            isNull(IdentityOrganizationPreferences.deletedAt),
          ),
        )
        .returning();

      if (!updated) {
        throw new Error(`Organization preference not found for update: ${existing.id}`);
      }

      return updated;
    }

    const [created] = await client
      .insert(IdentityOrganizationPreferences)
      .values({
        id: uuidv7(),
        identityId: entity.identityId,
        organizationId: entity.organizationId,
        tenantId: entity.tenantId,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  private client(options?: OrganizationPreferenceRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
