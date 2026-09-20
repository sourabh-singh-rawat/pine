import { IssueStatus, ItemPriority, PagingOptions, ServiceResponse } from "@pine/common";
import type { Issue } from "@/db";
import type {
  IssueWithHasChildren,
  IssueWithProject,
} from "@/features/issue/repositories";

export interface CreateIssueOptions {
  userId: string;
  projectId: string;
  type: string;
  name: string;
  assigneeIds: string[];
  description?: string;
  dueDate?: Date;
  statusId?: string;
  priority?: ItemPriority;
  parentIssueId?: string;
  estimate?: number;
  component?: string;
}

export interface FindIssueOptions {
  userId: string;
  issueId: string;
}

export interface FindSubIssuesOptions extends PagingOptions {
  userId: string;
  parentIssueId: string;
}

export interface UpdateIssueOptions {
  userId: string;
  issueId: string;
  type?: string;
  name?: string;
  statusId?: string;
  priority?: ItemPriority;
  assigneeIds?: string[];
  description?: string;
  dueDate?: Date | null;
  estimate?: number;
  component?: string;
}

export interface FindProjectIssuesOptions {
  projectId: string;
  userId: string;
}

export interface DeleteIssueOptions {
  id: string;
  userId: string;
}

export interface IIssueService {
  createIssue(options: CreateIssueOptions): Promise<string>;
  findIssue(options: FindIssueOptions): Promise<IssueWithProject | null>;
  findProjectIssues(options: FindProjectIssuesOptions): Promise<IssueWithHasChildren[]>;
  findSubIssues(options: FindSubIssuesOptions): Promise<Issue[]>;
  getIssue(issueId: string): Promise<Issue | null>;
  getIssueStatusList(): Promise<ServiceResponse<IssueStatus[]>>;
  getIssuePriorityList(): Promise<ServiceResponse<ItemPriority[]>>;
  updateIssue(options: UpdateIssueOptions): Promise<void>;
  deleteIssue(options: DeleteIssueOptions): Promise<void>;
}
