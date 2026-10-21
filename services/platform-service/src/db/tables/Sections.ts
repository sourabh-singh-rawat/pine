import { relations } from "drizzle-orm";
import { boolean, pgTable, text, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Organizations } from "@/db/tables/Organizations";
import { Tenants } from "@/db/tables/Tenants";

export const Sections = pgTable(
  "sections",
  {
    ...idColumn,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => Tenants.id),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => Organizations.id),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    ...auditColumns,
  },
  (table) => [
    unique().on(table.organizationId, table.slug),
    unique().on(table.organizationId, table.name),
  ],
);

export const SectionsRelations = relations(Sections, ({ one }) => ({
  tenant: one(Tenants, {
    fields: [Sections.tenantId],
    references: [Tenants.id],
  }),
  organization: one(Organizations, {
    fields: [Sections.organizationId],
    references: [Organizations.id],
  }),
}));

export type Section = typeof Sections.$inferSelect;
export type NewSection = typeof Sections.$inferInsert;
