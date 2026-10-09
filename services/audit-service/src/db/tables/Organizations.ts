import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Organizations = pgTable("organizations", {
  ...idColumn,
  tenantId: uuid("tenant_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ...auditColumns,
});

export type Organization = typeof Organizations.$inferSelect;
export type NewOrganization = typeof Organizations.$inferInsert;
