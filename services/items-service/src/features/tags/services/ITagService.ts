import type { Tag } from "@/db";

export type CreateTagOptions = {
  workspaceId: string;
  spaceId?: string | null;
  name: string;
  color?: string;
  description?: string | null;
};

export type UpdateTagOptions = {
  id: string;
  name?: string;
  color?: string;
  description?: string | null;
};

export type ListTagsOptions = {
  workspaceId: string;
  spaceId?: string | null;
};

export interface ITagService {
  list: (options: ListTagsOptions) => Promise<Tag[]>;
  getById: (id: string) => Promise<Tag | null>;
  create: (options: CreateTagOptions) => Promise<Tag>;
  update: (options: UpdateTagOptions) => Promise<Tag>;
  delete: (id: string) => Promise<boolean>;
  getItemTags: (itemId: string) => Promise<Tag[]>;
  setItemTags: (itemId: string, tagIds: string[]) => Promise<Tag[]>;
}
