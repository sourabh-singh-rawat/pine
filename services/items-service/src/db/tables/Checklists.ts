import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Checklists = pgTable("checklists", {
  ...idColumn,
  itemId: uuid("item_id").notNull(),
  name: text("name").notNull(),
  createdById: uuid("created_by_id").notNull(),
  ...auditColumns,
});

export type Checklist = typeof Checklists.$inferSelect;
export type NewChecklist = typeof Checklists.$inferInsert;
