import type { Item } from "@/db";

export type ListOptions = {
  userId: string;
  parentItemId: string;
};

export interface ISubItemService {
  list(options: ListOptions): Promise<Item[]>;
}
