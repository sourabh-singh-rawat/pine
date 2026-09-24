import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const AuditLogs = pgTable("audit_logs", {
  ...idColumn,
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  actorId: uuid("actor_id"),
  workspaceId: uuid("workspace_id"),
  tenantId: uuid("tenant_id"),
  payload: jsonb("payload"),
  ...auditColumns,
});

export type AuditLog = typeof AuditLogs.$inferSelect;
export type NewAuditLog = typeof AuditLogs.$inferInsert;
