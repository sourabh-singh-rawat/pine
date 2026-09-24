import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn } from "@/db/columns";

export const ItemAttachmentUploadRequests = pgTable("item_attachment_upload_requests", {
  ...idColumn,
  itemId: uuid("item_id").notNull(),
  status: text("status").notNull(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size"),
  createdById: uuid("created_by_id").notNull(),
  attachmentId: uuid("attachment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type ItemAttachmentUploadRequest = typeof ItemAttachmentUploadRequests.$inferSelect;
export type NewItemAttachmentUploadRequest =
  typeof ItemAttachmentUploadRequests.$inferInsert;
