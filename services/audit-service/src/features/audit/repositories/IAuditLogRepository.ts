import type { DbClient, AuditLog } from "@/db";

export type AuditLogRepositoryOptions = { tx?: DbClient };

export type CreateAuditLogEntity = {
  id?: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  workspaceId?: string | null;
  tenantId?: string | null;
  payload?: Record<string, unknown> | null;
};

export interface IAuditLogRepository {
  save: (entity: CreateAuditLogEntity, options?: AuditLogRepositoryOptions) => Promise<AuditLog>;
}
