import type { DbClient, Identity } from "@/db";

export type IdentityRepositoryOptions = { tx?: DbClient };

export type UpsertIdentityEntity = {
  id: string;
  displayName?: string | null;
};

export interface IIdentityRepository {
  upsert: (entity: UpsertIdentityEntity, options?: IdentityRepositoryOptions) => Promise<Identity>;
  findById: (id: string, options?: IdentityRepositoryOptions) => Promise<Identity | null>;
}
