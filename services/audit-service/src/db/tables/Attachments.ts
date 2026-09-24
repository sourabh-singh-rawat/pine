import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Attachments = pgTable("attachments", {
  ...idColumn,
  tenantId: uuid("tenant_id"),
  scopeType: text("scope_type").notNull(),
  scopeId: uuid("scope_id").notNull(),
  status: text("status").notNull(),
  createdBy: uuid("created_by").notNull(),
  ...auditColumns,
});

export type Attachment = typeof Attachments.$inferSelect;
export type NewAttachment = typeof Attachments.$inferInsert;
