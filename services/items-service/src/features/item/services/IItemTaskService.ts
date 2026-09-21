import { ServiceResponse, TaskFormData } from "@pine/common";
import type { CheckListItem } from "@/db";

export interface IItemTaskService {
  create(userId: string, itemId: string, taskFormData: TaskFormData): Promise<void>;
  list(itemId: string): Promise<ServiceResponse<CheckListItem[]>>;
  update(id: string, taskFormData: TaskFormData): Promise<void>;
}
