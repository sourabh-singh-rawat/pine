import { ProjectMember } from "../dtos";
import { ItemPriority, ItemStatus } from "../enums";

export interface ItemFormData {
  name: string;
  projectId: string;
  status: ItemStatus;
  priority: ItemPriority;
  reporter: ProjectMember;
  assignees: ProjectMember[];
  resolution: boolean;
  dueDate?: Date;
  id?: string;
  description?: string;
}
