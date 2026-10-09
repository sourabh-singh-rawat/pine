import { relations } from "drizzle-orm";
import { boolean, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Organizations } from "@/db/tables/Organizations";

export const Tenants = pgTable("tenants", {
  ...idColumn,
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  ...auditColumns,
});

export const TenantsRelations = relations(Tenants, ({ many }) => ({
  organizations: many(Organizations),
}));

export type Tenant = typeof Tenants.$inferSelect;
export type NewTenant = typeof Tenants.$inferInsert;
