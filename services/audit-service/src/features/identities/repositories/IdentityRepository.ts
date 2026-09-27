import { eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Identity, Identities } from "@/db";
import type {
  IIdentityRepository,
  IdentityRepositoryOptions,
  UpsertIdentityEntity,
} from "@/features/identities/repositories/IIdentityRepository";

@injectable()
export class IdentityRepository implements IIdentityRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  upsert = async (
    entity: UpsertIdentityEntity,
    options?: IdentityRepositoryOptions,
  ): Promise<Identity> => {
    const client = options?.tx ?? this.db;
    const now = new Date();
    const fullName = entity.fullName ?? entity.displayName ?? null;

    const [inserted] = await client
      .insert(Identities)
      .values({
        id: entity.identityId,
        identityId: entity.identityId,
        fullName,
        firstName: entity.firstName ?? null,
        middleName: entity.middleName ?? null,
        lastName: entity.lastName ?? null,
        createdAt: now,
        version: 1,
      })
      .onConflictDoNothing({ target: Identities.identityId })
      .returning();

    if (inserted) {
      return inserted;
    }

    const targetFullName = entity.fullName !== undefined ? entity.fullName : entity.displayName;

    const [updated] = await client
      .update(Identities)
      .set({
        ...(targetFullName !== undefined ? { fullName: targetFullName } : {}),
        ...(entity.firstName !== undefined ? { firstName: entity.firstName } : {}),
        ...(entity.middleName !== undefined ? { middleName: entity.middleName } : {}),
        ...(entity.lastName !== undefined ? { lastName: entity.lastName } : {}),
        updatedAt: now,
        version: sql`${Identities.version} + 1`,
      })
      .where(eq(Identities.identityId, entity.identityId))
      .returning();

    return updated;
  };

  findById = async (id: string, options?: IdentityRepositoryOptions): Promise<Identity | null> => {
    const client = options?.tx ?? this.db;
    const [row] = await client.select().from(Identities).where(eq(Identities.id, id)).limit(1);

    return row ?? null;
  };

  findByIdentityId = async (
    identityId: string,
    options?: IdentityRepositoryOptions,
  ): Promise<Identity | null> => {
    const client = options?.tx ?? this.db;
    const [row] = await client
      .select()
      .from(Identities)
      .where(eq(Identities.identityId, identityId))
      .limit(1);

    return row ?? null;
  };
}
