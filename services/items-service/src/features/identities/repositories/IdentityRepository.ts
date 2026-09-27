import { and, eq, isNull, sql } from "drizzle-orm";
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

  save = async (
    entity: CreateIdentityEntity,
    options?: IdentityRepositoryOptions,
  ): Promise<Identity> => {
    const client = this.client(options);
    const now = new Date();
    const fullName = entity.fullName ?? entity.displayName ?? null;

    const [created] = await client
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
      .returning();

    return created;
  };

  upsert = async (
    entity: CreateIdentityEntity,
    options?: IdentityRepositoryOptions,
  ): Promise<Identity> => {
    const client = this.client(options);
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

    const existing = await this.findByIdentityId(entity.identityId, options);
    if (!existing) {
      throw new Error(`Identity not found after conflict: ${entity.identityId}`);
    }

    const targetFullName = entity.fullName !== undefined ? entity.fullName : entity.displayName;
    const hasNewFullName = targetFullName !== undefined && targetFullName !== existing.fullName;
    const hasNewFirstName =
      entity.firstName !== undefined && entity.firstName !== existing.firstName;
    const hasNewMiddleName =
      entity.middleName !== undefined && entity.middleName !== existing.middleName;
    const hasNewLastName = entity.lastName !== undefined && entity.lastName !== existing.lastName;

    if (hasNewFullName || hasNewFirstName || hasNewMiddleName || hasNewLastName) {
      return this.update(
        existing.id,
        {
          fullName: targetFullName,
          firstName: entity.firstName,
          middleName: entity.middleName,
          lastName: entity.lastName,
        },
        options,
      );
    }

    return existing;
  };

  update = async (
    id: string,
    entity: Partial<
      Pick<Identity, "fullName" | "firstName" | "middleName" | "lastName" | "deletedAt">
    >,
    options?: IdentityRepositoryOptions,
  ): Promise<Identity> => {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(Identities)
      .set({
        ...(entity.fullName !== undefined ? { fullName: entity.fullName } : {}),
        ...(entity.firstName !== undefined ? { firstName: entity.firstName } : {}),
        ...(entity.middleName !== undefined ? { middleName: entity.middleName } : {}),
        ...(entity.lastName !== undefined ? { lastName: entity.lastName } : {}),
        ...(entity.deletedAt !== undefined ? { deletedAt: entity.deletedAt } : {}),
        updatedAt: now,
        version: sql`${Identities.version} + 1`,
      })
      .where(and(eq(Identities.id, id), isNull(Identities.deletedAt)))
      .returning();

    if (!updated) {
      throw new Error(`Identity not found for update: ${id}`);
    }

    return updated;
  };

  findById = async (id: string, options?: IdentityRepositoryOptions): Promise<Identity | null> => {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Identities)
      .where(and(eq(Identities.id, id), isNull(Identities.deletedAt)))
      .limit(1);

    return row ?? null;
  };

  findByIdentityId = async (
    identityId: string,
    options?: IdentityRepositoryOptions,
  ): Promise<Identity | null> => {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(Identities)
      .where(and(eq(Identities.identityId, identityId), isNull(Identities.deletedAt)))
      .limit(1);

    return row ?? null;
  };

  existsById = async (id: string, options?: IdentityRepositoryOptions): Promise<boolean> => {
    const identity = await this.findById(id, options);
    return identity != null;
  };

  existsByIdentityId = async (
    identityId: string,
    options?: IdentityRepositoryOptions,
  ): Promise<boolean> => {
    const identity = await this.findByIdentityId(identityId, options);
    return identity != null;
  };

  private client = (options?: IdentityRepositoryOptions) => options?.tx ?? this.db;
}
