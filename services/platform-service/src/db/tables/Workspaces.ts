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

export const Workspaces = pgTable(
  "workspaces",
  {
    ...idColumn,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => Tenants.id),
    parentWorkspaceId: uuid("parent_workspace_id").references((): AnyPgColumn => Workspaces.id),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    ...auditColumns,
  },
  (table) => [unique().on(table.tenantId, table.slug)],
);

export const WorkspacesRelations = relations(Workspaces, ({ one, many }) => ({
  tenant: one(Tenants, {
    fields: [Workspaces.tenantId],
    references: [Tenants.id],
  }),
  parentWorkspace: one(Workspaces, {
    fields: [Workspaces.parentWorkspaceId],
    references: [Workspaces.id],
    relationName: "workspaceHierarchy",
  }),
  childWorkspaces: many(Workspaces, {
    relationName: "workspaceHierarchy",
  }),
}));

export type Workspace = typeof Workspaces.$inferSelect;
export type NewWorkspace = typeof Workspaces.$inferInsert;
