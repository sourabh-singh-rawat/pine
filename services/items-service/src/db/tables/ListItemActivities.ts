import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const ListItemActivities = pgTable("list_item_activities", {
  ...idColumn,
  userId: uuid("user_id").notNull(),
  listId: uuid("list_id").notNull(),
  action: text("action").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  ...auditColumns,
});

export type ListItemActivity = typeof ListItemActivities.$inferSelect;
export type NewListItemActivity = typeof ListItemActivities.$inferInsert;
