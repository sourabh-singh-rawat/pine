import { pgTable, text } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const ItemAttachments = pgTable("item_attachments", {
  ...idColumn,
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  ownerId: text("owner_id").notNull(),
  itemId: text("item_id").notNull(),
  bucketName: text("bucket_name"),
  path: text("path"),
  variant: text("variant"),
  ...auditColumns,
});

export type ItemAttachment = typeof ItemAttachments.$inferSelect;
export type NewItemAttachment = typeof ItemAttachments.$inferInsert;
