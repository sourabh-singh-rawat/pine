import type { DbClient, Space } from "@/db";

export type SpaceRepositoryOptions = { tx: DbClient };

export type CreateSpaceEntity = {
  workspaceId: string;
  name: string;
  createdById: string;
  id?: string;
};

export type ListSpacesFilter = {
  workspaceId: string;
};

export interface ISpaceRepository {
  save: (
    entity: CreateSpaceEntity,
    options?: SpaceRepositoryOptions,
  ) => Promise<Space>;
  findById: (
    id: string,
    options?: SpaceRepositoryOptions,
  ) => Promise<Space | null>;
  findMany: (
    filter: ListSpacesFilter,
    options?: SpaceRepositoryOptions,
  ) => Promise<Space[]>;
}
