import { PaginatedOutput, PagingOptions } from "@pine/common";
import type { List } from "@/db";

export interface CreateListOptions {
  userId: string;
  spaceId: string;
  name: string;
}

export interface ListListsOptions extends PagingOptions {
  userId: string;
  spaceId: string;
}

export interface UpdateListOptions {
  id: string;
  userId: string;
  name: string;
}

export interface GetListOptions {
  id: string;
  userId: string;
}

export interface IListService {
  create(options: CreateListOptions): Promise<string>;
  getById(options: GetListOptions): Promise<List>;
  list(options: ListListsOptions): Promise<PaginatedOutput<List>>;
  update(options: UpdateListOptions): Promise<void>;
}
