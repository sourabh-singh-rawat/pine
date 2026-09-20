import { pgTable, text } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Identities = pgTable("identities", {
  ...idColumn,
  displayName: text("display_name"),
  ...auditColumns,
});

export type Identity = typeof Identities.$inferSelect;
export type NewIdentity = typeof Identities.$inferInsert;
