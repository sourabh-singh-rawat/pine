import type { DbClient, Workspace } from "@/db";

export type WorkspaceRepositoryOptions = { tx: DbClient };

export type CreateWorkspaceEntity = {
  tenantId: string;
  parentWorkspaceId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateWorkspaceEntity = {
  parentWorkspaceId?: string | null;
};

export type ListWorkspacesFilter = {
  tenantId: string;
  parentWorkspaceId?: string | null;
};

export interface IWorkspaceRepository {
  save(entity: CreateWorkspaceEntity, options?: WorkspaceRepositoryOptions): Promise<Workspace>;
  update(
    id: string,
    entity: UpdateWorkspaceEntity,
    options?: WorkspaceRepositoryOptions,
  ): Promise<Workspace | null>;
  findById(id: string): Promise<Workspace | null>;
  findByIds(ids: string[]): Promise<Workspace[]>;
  existsBySlugInTenant(tenantId: string, slug: string): Promise<boolean>;
  existsByNameInTenant(tenantId: string, name: string): Promise<boolean>;
  findMany(filter: ListWorkspacesFilter): Promise<Workspace[]>;
  softDelete(id: string, options?: WorkspaceRepositoryOptions): Promise<boolean>;
}
