import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const StatusOptions = pgTable("status_options", {
  ...idColumn,
  name: text("name").notNull(),
  type: text("type").notNull(),
  orderIndex: integer("order_index").notNull(),
  projectId: uuid("project_id").notNull(),
  ...auditColumns,
});

export type StatusOption = typeof StatusOptions.$inferSelect;
export type NewStatusOption = typeof StatusOptions.$inferInsert;
