import { pgTable, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const ItemAssignees = pgTable("item_assignees", {
  ...idColumn,
  itemId: uuid("item_id").notNull(),
  userId: uuid("user_id").notNull(),
  ...auditColumns,
});

export type ItemAssignee = typeof ItemAssignees.$inferSelect;
export type NewItemAssignee = typeof ItemAssignees.$inferInsert;
