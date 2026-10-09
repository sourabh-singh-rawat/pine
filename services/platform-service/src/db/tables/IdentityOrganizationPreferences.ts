import { pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Identities } from "@/db/tables/Identities";
import { Organizations } from "@/db/tables/Organizations";
import { Tenants } from "@/db/tables/Tenants";

export const IdentityOrganizationPreferences = pgTable(
  "identity_organization_preferences",
  {
    ...idColumn,
    identityId: uuid("identity_id")
      .notNull()
      .references(() => Identities.id),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => Organizations.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => Tenants.id),
    ...auditColumns,
  },
  (table) => [unique().on(table.identityId)],
);

export type IdentityOrganizationPreference = typeof IdentityOrganizationPreferences.$inferSelect;
export type NewIdentityOrganizationPreference = typeof IdentityOrganizationPreferences.$inferInsert;
