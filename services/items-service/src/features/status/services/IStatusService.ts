import { StatusType } from "@pine/common";
import type { DbClient, StatusOption } from "@/db";

export interface CreateOptionsOptions {
  projectId: string;
  statuses: { name: string; type: StatusType; orderIndex: number }[];
  tx?: DbClient;
}

export interface FindStatusesOptions {
  projectId: string;
}

export interface IStatusService {
  createOptions(options: CreateOptionsOptions): Promise<void>;
  findStatuses(options: FindStatusesOptions): Promise<StatusOption[]>;
}
