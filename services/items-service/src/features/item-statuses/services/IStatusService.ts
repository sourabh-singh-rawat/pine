import type { StatusType } from "@pine/common";
import type { DbClient, StatusOption } from "@/db";

export type SeedStatusInput = {
  name: string;
  type: StatusType;
  color: string;
  orderIndex: number;
};

export type SeedForListOptions = {
  listId: string;
  statuses: SeedStatusInput[];
  tx?: DbClient;
};

export type ListStatusesOptions = {
  listId: string;
  identityId: string;
};

export type CreateStatusOptions = {
  listId: string;
  name: string;
  type: string;
  color: string;
  identityId: string;
};

export type UpdateStatusOptions = {
  id: string;
  name?: string | null;
  type?: string | null;
  color?: string | null;
  identityId: string;
};

export type DeleteStatusOptions = {
  id: string;
  replacementStatusId?: string | null;
  identityId: string;
};

export type ReorderStatusesOptions = {
  listId: string;
  statusIds: string[];
  identityId: string;
};

export interface IStatusService {
  seedForList: (options: SeedForListOptions) => Promise<void>;
  list: (options: ListStatusesOptions) => Promise<StatusOption[]>;
  create: (options: CreateStatusOptions) => Promise<StatusOption>;
  update: (options: UpdateStatusOptions) => Promise<StatusOption>;
  delete: (options: DeleteStatusOptions) => Promise<void>;
  reorder: (options: ReorderStatusesOptions) => Promise<StatusOption[]>;
}
