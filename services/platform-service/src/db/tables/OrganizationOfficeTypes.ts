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

export const OrganizationOfficeTypes = pgTable(
  "organization_office_types",
  {
    ...idColumn,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => Tenants.id),
    parentOfficeTypeId: uuid("parent_office_type_id").references(
      (): AnyPgColumn => OrganizationOfficeTypes.id,
    ),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    ...auditColumns,
  },
  (table) => [unique().on(table.tenantId, table.slug), unique().on(table.tenantId, table.name)],
);

export const OrganizationOfficeTypesRelations = relations(OrganizationOfficeTypes, ({ one }) => ({
  tenant: one(Tenants, {
    fields: [OrganizationOfficeTypes.tenantId],
    references: [Tenants.id],
  }),
  parentOfficeType: one(OrganizationOfficeTypes, {
    fields: [OrganizationOfficeTypes.parentOfficeTypeId],
    references: [OrganizationOfficeTypes.id],
  }),
}));

export type OrganizationOfficeType = typeof OrganizationOfficeTypes.$inferSelect;
export type NewOrganizationOfficeType = typeof OrganizationOfficeTypes.$inferInsert;
