import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Identity, Identities } from "@/db";
import type {
  CreateIdentityEntity,
  IIdentityRepository,
  IdentityRepositoryOptions,
} from "@/features/identities/repositories/IIdentityRepository";

@injectable()
export class IdentityRepository implements IIdentityRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  private client(options?: IdentityRepositoryOptions) {
    return options?.tx ?? this.db;
  }

  async save(entity: CreateIdentityEntity, options?: IdentityRepositoryOptions): Promise<Identity> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(Identities)
      .values({
        id: entity.id,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async findById(id: string, options?: IdentityRepositoryOptions): Promise<Identity | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Identities)
      .where(and(eq(Identities.id, id), isNull(Identities.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async existsById(id: string, options?: IdentityRepositoryOptions): Promise<boolean> {
    const identity = await this.findById(id, options);
    return identity != null;
  }
}
