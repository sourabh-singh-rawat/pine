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

export const Organizations = pgTable(
  "organizations",
  {
    ...idColumn,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => Tenants.id),
    parentOrganizationId: uuid("parent_organization_id").references(
      (): AnyPgColumn => Organizations.id,
    ),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    ...auditColumns,
  },
  (table) => [unique().on(table.tenantId, table.slug)],
);

export const OrganizationsRelations = relations(Organizations, ({ one, many }) => ({
  tenant: one(Tenants, {
    fields: [Organizations.tenantId],
    references: [Tenants.id],
  }),
  parentOrganization: one(Organizations, {
    fields: [Organizations.parentOrganizationId],
    references: [Organizations.id],
    relationName: "organizationHierarchy",
  }),
  childOrganizations: many(Organizations, {
    relationName: "organizationHierarchy",
  }),
}));

export type Organization = typeof Organizations.$inferSelect;
export type NewOrganization = typeof Organizations.$inferInsert;
