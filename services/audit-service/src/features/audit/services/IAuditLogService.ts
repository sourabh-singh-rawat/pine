import type { AuditLog } from "@/db";

export type ListAuditLogsInput = {
  entityType: string;
  entityId: string;
  workspaceId: string;
};

export interface IAuditLogService {
  list: (input: ListAuditLogsInput, identityId: string) => Promise<AuditLog[]>;
}
