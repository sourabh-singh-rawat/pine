import { pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Identities } from "@/db/tables/Identities";
import { Workspaces } from "@/db/tables/Workspaces";
import { Tenants } from "@/db/tables/Tenants";

export const IdentityWorkspacePreferences = pgTable(
  "identity_workspace_preferences",
  {
    ...idColumn,
    identityId: uuid("identity_id")
      .notNull()
      .references(() => Identities.id),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => Workspaces.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => Tenants.id),
    ...auditColumns,
  },
  (table) => [unique().on(table.identityId)],
);

export type IdentityWorkspacePreference = typeof IdentityWorkspacePreferences.$inferSelect;
export type NewIdentityWorkspacePreference = typeof IdentityWorkspacePreferences.$inferInsert;
