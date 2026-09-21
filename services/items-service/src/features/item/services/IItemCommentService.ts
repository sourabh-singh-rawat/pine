import { ServiceResponse } from "@pine/common";
import type { ItemComment } from "@/db";

export interface IItemCommentService {
  create(userId: string, itemId: string, description: string): Promise<void>;
  list(itemId: string): Promise<ServiceResponse<ItemComment[]>>;
  delete(itemId: string): Promise<void>;
}
