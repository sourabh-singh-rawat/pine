import { relations } from "drizzle-orm";
import { pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Identities } from "@/db/tables/Identities";
import { Tenants } from "@/db/tables/Tenants";

export const TenantMembers = pgTable(
  "tenant_members",
  {
    ...idColumn,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => Tenants.id, { onDelete: "cascade" }),
    identityId: uuid("identity_id")
      .notNull()
      .references(() => Identities.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull(),
    ...auditColumns,
  },
  (table) => [unique().on(table.tenantId, table.identityId)],
);

export const TenantMembersRelations = relations(TenantMembers, ({ one }) => ({
  tenant: one(Tenants, {
    fields: [TenantMembers.tenantId],
    references: [Tenants.id],
  }),
  identity: one(Identities, {
    fields: [TenantMembers.identityId],
    references: [Identities.id],
  }),
}));

export type TenantMember = typeof TenantMembers.$inferSelect;
export type NewTenantMember = typeof TenantMembers.$inferInsert;
