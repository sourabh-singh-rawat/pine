import type { DbClient, Tag } from "@/db";

export type TagRepositoryOptions = {
  tx?: DbClient;
};

export type CreateTagEntity = {
  id?: string;
  workspaceId: string;
  spaceId?: string | null;
  name: string;
  color?: string;
  description?: string | null;
};

export type UpdateTagEntity = {
  name?: string;
  color?: string;
  description?: string | null;
};

export type FindTagsFilter = {
  workspaceId: string;
  spaceId?: string | null;
};

export interface ITagRepository {
  findById: (id: string, options?: TagRepositoryOptions) => Promise<Tag | null>;
  findMany: (filter: FindTagsFilter, options?: TagRepositoryOptions) => Promise<Tag[]>;
  save: (entity: CreateTagEntity, options?: TagRepositoryOptions) => Promise<Tag>;
  update: (id: string, entity: UpdateTagEntity, options?: TagRepositoryOptions) => Promise<Tag>;
  softDelete: (id: string, options?: TagRepositoryOptions) => Promise<boolean>;
}
