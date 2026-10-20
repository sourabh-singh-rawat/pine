import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Tenants } from "@/db/tables/Tenants";

export const OrganizationTypes = pgTable(
  "organization_types",
  {
    ...idColumn,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => Tenants.id),
    parentOrganizationTypeId: uuid("parent_organization_type_id").references(
      (): AnyPgColumn => OrganizationTypes.id,
    ),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    ...auditColumns,
  },
  (table) => [unique().on(table.tenantId, table.slug), unique().on(table.tenantId, table.name)],
);

export const OrganizationTypesRelations = relations(OrganizationTypes, ({ one }) => ({
  tenant: one(Tenants, {
    fields: [OrganizationTypes.tenantId],
    references: [Tenants.id],
  }),
  parentOrganizationType: one(OrganizationTypes, {
    fields: [OrganizationTypes.parentOrganizationTypeId],
    references: [OrganizationTypes.id],
  }),
}));

export type OrganizationType = typeof OrganizationTypes.$inferSelect;
export type NewOrganizationType = typeof OrganizationTypes.$inferInsert;
