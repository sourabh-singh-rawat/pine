import type { ChecklistEntry, DbClient } from "@/db";

export type ChecklistEntryRepositoryOptions = { tx?: DbClient };

export type CreateChecklistEntryEntity = {
  id?: string;
  checklistId: string;
  title: string;
  completed?: boolean;
  orderIndex: number;
  createdById: string;
};

export type UpdateChecklistEntryEntity = {
  title?: string;
  completed?: boolean;
};

export interface IChecklistEntryRepository {
  save: (
    entity: CreateChecklistEntryEntity,
    options?: ChecklistEntryRepositoryOptions,
  ) => Promise<ChecklistEntry>;
  update: (
    id: string,
    entity: UpdateChecklistEntryEntity,
    options?: ChecklistEntryRepositoryOptions,
  ) => Promise<ChecklistEntry | null>;
  findById: (
    id: string,
    options?: ChecklistEntryRepositoryOptions,
  ) => Promise<ChecklistEntry | null>;
  findByChecklistId: (
    checklistId: string,
    options?: ChecklistEntryRepositoryOptions,
  ) => Promise<ChecklistEntry[]>;
  findByChecklistIds: (
    checklistIds: string[],
    options?: ChecklistEntryRepositoryOptions,
  ) => Promise<ChecklistEntry[]>;
  findMaxOrderIndex: (
    checklistId: string,
    options?: ChecklistEntryRepositoryOptions,
  ) => Promise<number | null>;
  softDelete: (
    id: string,
    options?: ChecklistEntryRepositoryOptions,
  ) => Promise<boolean>;
  softDeleteByChecklistId: (
    checklistId: string,
    options?: ChecklistEntryRepositoryOptions,
  ) => Promise<number>;
  replaceOrderIndexes: (
    orderedIds: string[],
    options?: ChecklistEntryRepositoryOptions,
  ) => Promise<void>;
}
