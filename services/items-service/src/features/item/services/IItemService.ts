import { ItemStatus, ItemPriority, ServiceResponse } from "@pine/common";
import type { StatusOption } from "@/db";
import type { ItemWithHasChildren, ItemWithList } from "@/features/item/repositories";

export interface CreateItemOptions {
  userId: string;
  listId: string;
  type: string;
  name: string;
  assigneeIds: string[];
  description?: string;
  dueDate?: Date;
  statusId?: string;
  priority?: ItemPriority;
  parentItemId?: string;
  estimate?: number;
  component?: string;
}

export interface GetItemOptions {
  userId: string;
  itemId: string;
}

export interface UpdateItemOptions {
  userId: string;
  itemId: string;
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

export interface ListItemsOptions {
  listId: string;
  userId: string;
}

export interface DeleteItemOptions {
  id: string;
  userId: string;
}

export type ItemStatusGroup = {
  status: StatusOption;
  items: ItemWithHasChildren[];
};

export interface IItemService {
  create(options: CreateItemOptions): Promise<string>;
  getById(options: GetItemOptions): Promise<ItemWithList | null>;
  list(options: ListItemsOptions): Promise<ItemStatusGroup[]>;
  update(options: UpdateItemOptions): Promise<void>;
  delete(options: DeleteItemOptions): Promise<void>;
  getStatusList(): Promise<ServiceResponse<ItemStatus[]>>;
  getPriorityList(): Promise<ServiceResponse<ItemPriority[]>>;
}
