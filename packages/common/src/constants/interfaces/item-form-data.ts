import { ListMember } from "../dtos";
import { ItemPriority, ItemStatus } from "../enums";

export interface ItemFormData {
  name: string;
  listId: string;
  status: ItemStatus;
  priority: ItemPriority;
  reporter: ListMember;
  assignees: ListMember[];
  resolution: boolean;
  dueDate?: Date;
  id?: string;
  description?: string;
}
