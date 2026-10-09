import type { DbClient, Space } from "@/db";

export type SpaceRepositoryOptions = { tx: DbClient };

export type CreateSpaceEntity = {
  organizationId: string;
  name: string;
  createdById: string;
  id?: string;
};

export type UpdateSpaceEntity = {
  name?: string;
};

export type ListSpacesFilter = {
  organizationId: string;
};

export interface ISpaceRepository {
  save: (entity: CreateSpaceEntity, options?: SpaceRepositoryOptions) => Promise<Space>;
  update: (
    id: string,
    entity: UpdateSpaceEntity,
    options?: SpaceRepositoryOptions,
  ) => Promise<Space>;
  findById: (id: string, options?: SpaceRepositoryOptions) => Promise<Space | null>;
  findMany: (filter: ListSpacesFilter, options?: SpaceRepositoryOptions) => Promise<Space[]>;
}
