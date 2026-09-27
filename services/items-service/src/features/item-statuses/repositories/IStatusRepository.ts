import type { DbClient, StatusOption } from "@/db";

export type StatusRepositoryOptions = { tx?: DbClient };

export type CreateStatusEntity = {
  id?: string;
  name: string;
  type: string;
  color: string;
  orderIndex: number;
  listId: string;
};

export type UpdateStatusEntity = {
  name?: string;
  type?: string;
  color?: string;
  orderIndex?: number;
};

export interface IStatusRepository {
  save: (entity: CreateStatusEntity, options?: StatusRepositoryOptions) => Promise<StatusOption>;
  saveMany: (
    entities: CreateStatusEntity[],
    options?: StatusRepositoryOptions,
  ) => Promise<StatusOption[]>;
  update: (
    id: string,
    entity: UpdateStatusEntity,
    options?: StatusRepositoryOptions,
  ) => Promise<StatusOption | null>;
  findById: (id: string, options?: StatusRepositoryOptions) => Promise<StatusOption | null>;
  findByListId: (listId: string, options?: StatusRepositoryOptions) => Promise<StatusOption[]>;
  findMaxOrderIndex: (listId: string, options?: StatusRepositoryOptions) => Promise<number | null>;
  softDelete: (id: string, options?: StatusRepositoryOptions) => Promise<boolean>;
  replaceOrderIndexes: (orderedIds: string[], options?: StatusRepositoryOptions) => Promise<void>;
}
