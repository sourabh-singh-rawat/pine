import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const ItemActivities = pgTable("item_activities", {
  ...idColumn,
  type: text("type").notNull(),
  itemId: uuid("item_id").notNull(),
  listId: uuid("list_id").notNull(),
  userId: uuid("user_id").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  ...auditColumns,
});

export type ItemActivity = typeof ItemActivities.$inferSelect;
export type NewItemActivity = typeof ItemActivities.$inferInsert;
