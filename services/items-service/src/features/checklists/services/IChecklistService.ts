import type { Checklist, ChecklistEntry } from "@/db";

export type ListChecklistsOptions = {
  itemId: string;
  identityId: string;
};

export type CreateChecklistOptions = {
  itemId: string;
  name?: string | null;
  identityId: string;
};

export type UpdateChecklistOptions = {
  id: string;
  name: string;
  identityId: string;
};

export type DeleteChecklistOptions = {
  id: string;
  identityId: string;
};

export type CreateChecklistEntryOptions = {
  checklistId: string;
  title: string;
  identityId: string;
};

export type UpdateChecklistEntryOptions = {
  id: string;
  title?: string | null;
  completed?: boolean | null;
  identityId: string;
};

export type DeleteChecklistEntryOptions = {
  id: string;
  identityId: string;
};

export type ReorderChecklistEntriesOptions = {
  checklistId: string;
  ids: string[];
  identityId: string;
};

export type ChecklistWithEntries = {
  checklist: Checklist;
  entries: ChecklistEntry[];
  completedCount: number;
  totalCount: number;
};

export interface IChecklistService {
  list: (options: ListChecklistsOptions) => Promise<ChecklistWithEntries[]>;
  create: (options: CreateChecklistOptions) => Promise<ChecklistWithEntries>;
  update: (options: UpdateChecklistOptions) => Promise<ChecklistWithEntries>;
  delete: (options: DeleteChecklistOptions) => Promise<void>;
  createEntry: (options: CreateChecklistEntryOptions) => Promise<ChecklistEntry>;
  updateEntry: (options: UpdateChecklistEntryOptions) => Promise<ChecklistEntry>;
  deleteEntry: (options: DeleteChecklistEntryOptions) => Promise<void>;
  reorderEntries: (options: ReorderChecklistEntriesOptions) => Promise<ChecklistEntry[]>;
}
