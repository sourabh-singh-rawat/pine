import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Spaces } from "@/db/tables/Spaces";

export const Tags = pgTable("tags", {
  ...idColumn,
  workspaceId: uuid("workspace_id").notNull(),
  spaceId: uuid("space_id"),
  name: text("name").notNull(),
  color: text("color").notNull().default("#64748B"),
  description: text("description"),
  ...auditColumns,
});

export const TagsRelations = relations(Tags, ({ one }) => ({
  space: one(Spaces, {
    fields: [Tags.spaceId],
    references: [Spaces.id],
  }),
}));

export type Tag = typeof Tags.$inferSelect;
export type NewTag = typeof Tags.$inferInsert;
