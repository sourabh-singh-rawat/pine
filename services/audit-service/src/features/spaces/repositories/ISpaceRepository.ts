import type { DbClient, Space } from "@/db";

export type SpaceRepositoryOptions = { tx?: DbClient };

export type UpsertSpaceEntity = {
  id: string;
  workspaceId: string;
  name: string;
  createdById: string;
};

export interface ISpaceRepository {
  upsert: (entity: UpsertSpaceEntity, options?: SpaceRepositoryOptions) => Promise<Space>;
  findById: (id: string, options?: SpaceRepositoryOptions) => Promise<Space | null>;
}
