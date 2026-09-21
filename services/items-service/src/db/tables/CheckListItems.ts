import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const CheckListItems = pgTable("check_list_items", {
  ...idColumn,
  description: text("description"),
  itemId: uuid("item_id").notNull(),
  ownerId: uuid("owner_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date", { withTimezone: true }),
  ...auditColumns,
});

export type CheckListItem = typeof CheckListItems.$inferSelect;
export type NewCheckListItem = typeof CheckListItems.$inferInsert;
