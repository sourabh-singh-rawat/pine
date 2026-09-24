import type { DbClient, StatusOption } from "@/db";

export type StatusRepositoryOptions = { tx?: DbClient };

export type CreateStatusEntity = {
  id?: string;
  name: string;
  type: string;
  orderIndex: number;
  listId: string;
};

export interface IStatusRepository {
  saveMany(
    entities: CreateStatusEntity[],
    options?: StatusRepositoryOptions,
  ): Promise<StatusOption[]>;
  findByListId(listId: string, options?: StatusRepositoryOptions): Promise<StatusOption[]>;
}
