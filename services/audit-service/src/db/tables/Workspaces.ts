import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Workspaces = pgTable("workspaces", {
  ...idColumn,
  tenantId: uuid("tenant_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ...auditColumns,
});

export type Workspace = typeof Workspaces.$inferSelect;
export type NewWorkspace = typeof Workspaces.$inferInsert;
