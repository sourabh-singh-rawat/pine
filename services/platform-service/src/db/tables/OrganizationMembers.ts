import { relations } from "drizzle-orm";
import { pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";
import { Identities } from "@/db/tables/Identities";
import { Organizations } from "@/db/tables/Organizations";

export const OrganizationMembers = pgTable(
  "organization_members",
  {
    ...idColumn,
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => Organizations.id, { onDelete: "cascade" }),
    identityId: uuid("identity_id")
      .notNull()
      .references(() => Identities.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull(),
    ...auditColumns,
  },
  (table) => [unique().on(table.organizationId, table.identityId)],
);

export const OrganizationMembersRelations = relations(OrganizationMembers, ({ one }) => ({
  organization: one(Organizations, {
    fields: [OrganizationMembers.organizationId],
    references: [Organizations.id],
  }),
  identity: one(Identities, {
    fields: [OrganizationMembers.identityId],
    references: [Identities.id],
  }),
}));

export type OrganizationMember = typeof OrganizationMembers.$inferSelect;
export type NewOrganizationMember = typeof OrganizationMembers.$inferInsert;
