import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Spaces = pgTable("spaces", {
  ...idColumn,
  workspaceId: uuid("workspace_id").notNull(),
  name: text("name").notNull(),
  createdById: uuid("created_by_id").notNull(),
  ...auditColumns,
});

export type Space = typeof Spaces.$inferSelect;
export type NewSpace = typeof Spaces.$inferInsert;
