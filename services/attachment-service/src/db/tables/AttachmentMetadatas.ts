import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn } from "@/db/columns";
import { Attachments } from "@/db/tables/Attachments";
import { AttachmentVersions } from "@/db/tables/AttachmentVersions";

export const AttachmentMetadatas = pgTable("attachment_metadatas", {
  ...idColumn,
  attachmentId: uuid("attachment_id")
    .notNull()
    .references(() => Attachments.id),
  versionId: uuid("version_id")
    .notNull()
    .references(() => AttachmentVersions.id),
  width: integer("width"),
  height: integer("height"),
  format: text("format"),
  space: text("space"),
  channels: integer("channels"),
  density: integer("density"),
  hasAlpha: boolean("has_alpha"),
  orientation: integer("orientation"),
  extractedAt: timestamp("extracted_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AttachmentMetadata = typeof AttachmentMetadatas.$inferSelect;
export type NewAttachmentMetadata = typeof AttachmentMetadatas.$inferInsert;
