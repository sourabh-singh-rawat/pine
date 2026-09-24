import type { DbClient, Workspace } from "@/db";

export type WorkspaceRepositoryOptions = { tx?: DbClient };

export type UpsertWorkspaceEntity = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
};

export interface IWorkspaceRepository {
  upsert: (
    entity: UpsertWorkspaceEntity,
    options?: WorkspaceRepositoryOptions,
  ) => Promise<Workspace>;
  findById: (id: string, options?: WorkspaceRepositoryOptions) => Promise<Workspace | null>;
}
