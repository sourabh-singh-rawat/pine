import type { Checklist, DbClient } from "@/db";

export type ChecklistRepositoryOptions = { tx?: DbClient };

export type CreateChecklistEntity = {
  id?: string;
  itemId: string;
  name: string;
  createdById: string;
};

export type UpdateChecklistEntity = {
  name: string;
};

export type ChecklistSummary = {
  id: string;
  itemId: string;
  name: string;
  createdById: string;
  createdAt: Date;
  completedCount: number;
  totalCount: number;
};

export interface IChecklistRepository {
  save: (entity: CreateChecklistEntity, options?: ChecklistRepositoryOptions) => Promise<Checklist>;
  update: (
    id: string,
    entity: UpdateChecklistEntity,
    options?: ChecklistRepositoryOptions,
  ) => Promise<Checklist | null>;
  findById: (id: string, options?: ChecklistRepositoryOptions) => Promise<Checklist | null>;
  findByItemId: (itemId: string, options?: ChecklistRepositoryOptions) => Promise<Checklist[]>;
  findSummariesByItemIds: (
    itemIds: string[],
    options?: ChecklistRepositoryOptions,
  ) => Promise<ChecklistSummary[]>;
  softDelete: (id: string, options?: ChecklistRepositoryOptions) => Promise<boolean>;
}
