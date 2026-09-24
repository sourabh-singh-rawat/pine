import { ItemStatus, ItemPriority, ServiceResponse } from "@pine/common";
import type {
  ItemWithHasChildren,
  ItemWithProject,
} from "@/features/item/repositories";

export interface CreateItemOptions {
  userId: string;
  projectId: string;
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
  projectId: string;
  userId: string;
}

export interface DeleteItemOptions {
  id: string;
  userId: string;
}

export interface IItemService {
  create(options: CreateItemOptions): Promise<string>;
  getById(options: GetItemOptions): Promise<ItemWithProject | null>;
  list(options: ListItemsOptions): Promise<ItemWithHasChildren[]>;
  update(options: UpdateItemOptions): Promise<void>;
  delete(options: DeleteItemOptions): Promise<void>;
  getStatusList(): Promise<ServiceResponse<ItemStatus[]>>;
  getPriorityList(): Promise<ServiceResponse<ItemPriority[]>>;
}
