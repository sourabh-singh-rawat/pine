import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn } from "@/db/columns";
import { Attachments } from "@/db/tables/Attachments";
import { AttachmentVersions } from "@/db/tables/AttachmentVersions";

export const AttachmentDerivatives = pgTable("attachment_derivatives", {
  ...idColumn,
  attachmentId: uuid("attachment_id")
    .notNull()
    .references(() => Attachments.id),
  versionId: uuid("version_id")
    .notNull()
    .references(() => AttachmentVersions.id),
  derivativeType: text("derivative_type").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  storageProvider: text("storage_provider").notNull(),
  storageObjectKey: text("storage_object_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AttachmentDerivative = typeof AttachmentDerivatives.$inferSelect;
export type NewAttachmentDerivative = typeof AttachmentDerivatives.$inferInsert;
