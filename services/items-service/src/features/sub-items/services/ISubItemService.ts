import type { Item } from "@/db";

export type ListOptions = {
  identityId: string;
  parentItemId: string;
};

export interface ISubItemService {
  list(options: ListOptions): Promise<Item[]>;
}
