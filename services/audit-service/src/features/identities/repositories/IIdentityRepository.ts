import type { DbClient, Identity } from "@/db";

export type IdentityRepositoryOptions = { tx?: DbClient };

export type UpsertIdentityEntity = {
  identityId: string;
  fullName?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
};

export interface IIdentityRepository {
  upsert: (entity: UpsertIdentityEntity, options?: IdentityRepositoryOptions) => Promise<Identity>;
  findById: (id: string, options?: IdentityRepositoryOptions) => Promise<Identity | null>;
  findByIdentityId: (
    identityId: string,
    options?: IdentityRepositoryOptions,
  ) => Promise<Identity | null>;
  findByIdentityIds: (
    identityIds: string[],
    options?: IdentityRepositoryOptions,
  ) => Promise<Identity[]>;
}
