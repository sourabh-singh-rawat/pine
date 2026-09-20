import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const Projects = pgTable("projects", {
  ...idColumn,
  spaceId: uuid("space_id").notNull(),
  name: text("name").notNull(),
  createdById: uuid("created_by_id").notNull(),
  ...auditColumns,
});

export type Project = typeof Projects.$inferSelect;
export type NewProject = typeof Projects.$inferInsert;
