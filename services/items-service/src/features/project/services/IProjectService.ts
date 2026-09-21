import { PaginatedOutput, PagingOptions } from "@pine/common";
import type { Project } from "@/db";

export interface CreateProjectOptions {
  userId: string;
  spaceId: string;
  name: string;
}

export interface FindProjectsOptions extends PagingOptions {
  userId: string;
  spaceId: string;
}

export interface UpdateProjectOptions {
  id: string;
  name?: string;
}

export interface FindProjectOptions {
  id: string;
  userId: string;
}

export interface IProjectService {
  createProject(options: CreateProjectOptions): Promise<string>;
  findProject(options: FindProjectOptions): Promise<Project>;
  findProjects(options: FindProjectsOptions): Promise<PaginatedOutput<Project>>;
  updateProject(options: UpdateProjectOptions): Promise<void>;
}
