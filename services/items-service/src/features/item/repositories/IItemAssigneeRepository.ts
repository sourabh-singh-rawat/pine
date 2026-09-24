import type { DbClient, ItemAssignee } from "@/db";

export type ItemAssigneeRepositoryOptions = { tx?: DbClient };

export type CreateItemAssigneeEntity = {
  id?: string;
  itemId: string;
  userId: string;
};

export interface IItemAssigneeRepository {
  saveMany(
    entities: CreateItemAssigneeEntity[],
    options?: ItemAssigneeRepositoryOptions,
  ): Promise<ItemAssignee[]>;
}
