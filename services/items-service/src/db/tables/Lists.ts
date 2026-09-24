import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Lists = pgTable("lists", {
  ...idColumn,
  spaceId: uuid("space_id").notNull(),
  name: text("name").notNull(),
  createdById: uuid("created_by_id").notNull(),
  ...auditColumns,
});

export type List = typeof Lists.$inferSelect;
export type NewList = typeof Lists.$inferInsert;
