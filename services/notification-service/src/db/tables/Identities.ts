import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Identities = pgTable("identities", {
  ...idColumn,
  identityId: uuid("identity_id").notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  firstName: text("first_name"),
  middleName: text("middle_name"),
  lastName: text("last_name"),
  ...auditColumns,
});

export type Identity = typeof Identities.$inferSelect;
export type NewIdentity = typeof Identities.$inferInsert;
