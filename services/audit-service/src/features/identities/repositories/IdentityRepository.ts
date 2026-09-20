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

    const [inserted] = await client
      .insert(Identities)
      .values({
        id: entity.id,
        displayName: entity.displayName ?? null,
        createdAt: now,
        version: 1,
      })
      .onConflictDoNothing({ target: Identities.id })
      .returning();

    if (inserted) {
      return inserted;
    }

    const [updated] = await client
      .update(Identities)
      .set({
        ...(entity.displayName !== undefined ? { displayName: entity.displayName } : {}),
        updatedAt: now,
        version: sql`${Identities.version} + 1`,
      })
      .where(eq(Identities.id, entity.id))
      .returning();

    return updated;
  };

  findById = async (id: string, options?: IdentityRepositoryOptions): Promise<Identity | null> => {
    const client = options?.tx ?? this.db;
    const [row] = await client.select().from(Identities).where(eq(Identities.id, id)).limit(1);

    return row ?? null;
  };
}
