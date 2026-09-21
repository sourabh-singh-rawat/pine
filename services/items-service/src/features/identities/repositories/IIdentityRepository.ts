import type { DbClient, Identity } from "@/db";

export type IdentityRepositoryOptions = { tx?: DbClient };

export type CreateIdentityEntity = {
  id: string;
};

export interface IIdentityRepository {
  save(entity: CreateIdentityEntity, options?: IdentityRepositoryOptions): Promise<Identity>;
  findById(id: string, options?: IdentityRepositoryOptions): Promise<Identity | null>;
  existsById(id: string, options?: IdentityRepositoryOptions): Promise<boolean>;
}
