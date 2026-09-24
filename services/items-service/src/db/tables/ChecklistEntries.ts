import { boolean, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const ChecklistEntries = pgTable("checklist_entries", {
  ...idColumn,
  checklistId: uuid("checklist_id").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  orderIndex: integer("order_index").notNull(),
  createdById: uuid("created_by_id").notNull(),
  ...auditColumns,
});

export type ChecklistEntry = typeof ChecklistEntries.$inferSelect;
export type NewChecklistEntry = typeof ChecklistEntries.$inferInsert;
