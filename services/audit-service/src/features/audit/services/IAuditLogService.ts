import type { AuditLog, Identity } from "@/db";

export type ListAuditLogsInput = {
  entityType: string;
  entityId: string;
  organizationId: string;
};

export type AuditLogWithActor = AuditLog & {
  actor: Identity | null;
};

export interface IAuditLogService {
  list: (input: ListAuditLogsInput, identityId: string) => Promise<AuditLogWithActor[]>;
}
