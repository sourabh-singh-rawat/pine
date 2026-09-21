import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Projects } from "@/db/tables/Projects";

export const Items = pgTable("items", {
  ...idColumn,
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  statusId: uuid("status_id").notNull(),
  priority: text("priority").notNull(),
  projectId: uuid("list_id").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdById: uuid("created_by_id").notNull(),
  updatedById: uuid("updated_by_id"),
  parentItemId: uuid("parent_item_id"),
  estimate: integer("estimate"),
  component: text("component"),
  ...auditColumns,
});

export const ItemsRelations = relations(Items, ({ one }) => ({
  project: one(Projects, {
    fields: [Items.projectId],
    references: [Projects.id],
  }),
  parentItem: one(Items, {
    fields: [Items.parentItemId],
    references: [Items.id],
    relationName: "item_hierarchy",
  }),
}));

export type Item = typeof Items.$inferSelect;
export type NewItem = typeof Items.$inferInsert;
