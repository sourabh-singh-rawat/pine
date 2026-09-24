import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const ItemAttachments = pgTable("item_attachments", {
  ...idColumn,
  itemId: uuid("item_id").notNull(),
  attachmentId: uuid("attachment_id").notNull(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size"),
  createdById: uuid("created_by_id").notNull(),
  ...auditColumns,
});

export type ItemAttachment = typeof ItemAttachments.$inferSelect;
export type NewItemAttachment = typeof ItemAttachments.$inferInsert;
