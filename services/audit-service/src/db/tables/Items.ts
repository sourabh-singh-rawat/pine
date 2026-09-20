import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Items = pgTable("items", {
  ...idColumn,
  name: text("name").notNull(),
  type: text("type").notNull(),
  priority: text("priority"),
  projectId: uuid("list_id").notNull(),
  createdById: uuid("created_by_id").notNull(),
  updatedById: uuid("updated_by_id"),
  ...auditColumns,
});

export type Item = typeof Items.$inferSelect;
export type NewItem = typeof Items.$inferInsert;
