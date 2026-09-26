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

export type ChecklistCounts = {
  itemId: string;
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
  findCountsByItemIds: (
    itemIds: string[],
    options?: ChecklistRepositoryOptions,
  ) => Promise<ChecklistCounts[]>;
  softDelete: (id: string, options?: ChecklistRepositoryOptions) => Promise<boolean>;
}
