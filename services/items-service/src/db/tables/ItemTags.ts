import { relations } from "drizzle-orm";
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Items } from "@/db/tables/Items";
import { Tags } from "@/db/tables/Tags";

export const ItemTags = pgTable("item_tags", {
  ...idColumn,
  itemId: uuid("item_id").notNull(),
  tagId: uuid("tag_id").notNull(),
  ...auditColumns,
});

export const ItemTagsRelations = relations(ItemTags, ({ one }) => ({
  item: one(Items, {
    fields: [ItemTags.itemId],
    references: [Items.id],
  }),
  tag: one(Tags, {
    fields: [ItemTags.tagId],
    references: [Tags.id],
  }),
}));

export type ItemTag = typeof ItemTags.$inferSelect;
export type NewItemTag = typeof ItemTags.$inferInsert;
