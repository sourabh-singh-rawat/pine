import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { idColumn } from "@/db/columns";
import { Identities } from "@/db/tables/Identities";
import type { AttachmentScopeType } from "@/features/attachment/constants";

export const AttachmentUploads = pgTable("attachment_uploads", {
  ...idColumn,
  scopeType: text("scope_type").$type<AttachmentScopeType>().notNull(),
  scopeId: uuid("scope_id").notNull(),
  operationId: uuid("operation_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  status: text("status").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  expectedSize: integer("expected_size").notNull(),
  storageProvider: text("storage_provider").notNull(),
  storageObjectKey: text("storage_object_key").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => Identities.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type AttachmentUpload = typeof AttachmentUploads.$inferSelect;
export type NewAttachmentUpload = typeof AttachmentUploads.$inferInsert;
