import type { ItemPriority } from "@pine/common";
import type { DbClient, Issue, Project } from "@/db";

export type IssueRepositoryOptions = { tx?: DbClient };

export type CreateIssueEntity = {
  id?: string;
  name: string;
  description?: string | null;
  type: string;
  statusId: string;
  priority: ItemPriority | string;
  projectId: string;
  createdById: string;
  parentIssueId?: string | null;
  dueDate?: Date | null;
  estimate?: number | null;
  component?: string | null;
};

export type UpdateIssueEntity = {
  name?: string;
  description?: string | null;
  type?: string;
  statusId?: string;
  priority?: ItemPriority | string;
  dueDate?: Date | null;
  estimate?: number | null;
  component?: string | null;
  updatedById?: string | null;
};

export type IssueWithProject = Issue & {
  project: Project;
};

export type IssueWithHasChildren = Issue & {
  hasChildren: boolean;
};

export interface IIssueRepository {
  save(entity: CreateIssueEntity, options?: IssueRepositoryOptions): Promise<Issue>;
  update(
    id: string,
    userId: string,
    entity: UpdateIssueEntity,
    options?: IssueRepositoryOptions,
  ): Promise<Issue>;
  softDelete(id: string, options?: IssueRepositoryOptions): Promise<boolean>;
  findById(id: string, options?: IssueRepositoryOptions): Promise<Issue | null>;
  findByIdForUser(
    id: string,
    userId: string,
    options?: IssueRepositoryOptions,
  ): Promise<IssueWithProject | null>;
  findRootsByProject(
    projectId: string,
    userId: string,
    options?: IssueRepositoryOptions,
  ): Promise<IssueWithHasChildren[]>;
  findChildren(
    parentIssueId: string,
    userId: string,
    options?: IssueRepositoryOptions,
  ): Promise<Issue[]>;
}
