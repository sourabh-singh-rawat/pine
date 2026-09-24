import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const ItemComments = pgTable("item_comments", {
  ...idColumn,
  description: text("description").notNull(),
  itemId: uuid("item_id").notNull(),
  userId: uuid("user_id").notNull(),
  ...auditColumns,
});

export type ItemComment = typeof ItemComments.$inferSelect;
export type NewItemComment = typeof ItemComments.$inferInsert;
