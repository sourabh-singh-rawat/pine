import type { DbClient, Identity } from "@/db";

export type IdentityRepositoryOptions = { tx?: DbClient };

export type CreateIdentityEntity = {
  identityId: string;
  fullName?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
};

export interface IIdentityRepository {
  save: (entity: CreateIdentityEntity, options?: IdentityRepositoryOptions) => Promise<Identity>;
  upsert: (entity: CreateIdentityEntity, options?: IdentityRepositoryOptions) => Promise<Identity>;
  update: (
    id: string,
    entity: Partial<
      Pick<Identity, "fullName" | "firstName" | "middleName" | "lastName" | "deletedAt">
    >,
    options?: IdentityRepositoryOptions,
  ) => Promise<Identity>;
  findById: (id: string, options?: IdentityRepositoryOptions) => Promise<Identity | null>;
  findByIdentityId: (
    identityId: string,
    options?: IdentityRepositoryOptions,
  ) => Promise<Identity | null>;
  existsByIdentityId: (identityId: string, options?: IdentityRepositoryOptions) => Promise<boolean>;
}
