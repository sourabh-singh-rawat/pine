import type { DbClient, Project } from "@/db";

export type ProjectRepositoryOptions = { tx?: DbClient };

export type CreateProjectEntity = {
  id?: string;
  spaceId: string;
  name: string;
  createdById: string;
};

export type UpdateProjectEntity = {
  name?: string;
};

export interface IProjectRepository {
  save(entity: CreateProjectEntity, options?: ProjectRepositoryOptions): Promise<Project>;
  update(
    id: string,
    entity: UpdateProjectEntity,
    options?: ProjectRepositoryOptions,
  ): Promise<Project>;
  findById(id: string, options?: ProjectRepositoryOptions): Promise<Project | null>;
  findBySpaceId(
    spaceId: string,
    page?: number | null,
    pageSize?: number | null,
    options?: ProjectRepositoryOptions,
  ): Promise<{ rows: Project[]; rowCount: number }>;
}
