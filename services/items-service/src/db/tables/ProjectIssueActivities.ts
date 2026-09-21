import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, idColumn } from "@/db/columns";

export const ProjectIssueActivities = pgTable("list_item_activities", {
  ...idColumn,
  userId: uuid("user_id").notNull(),
  projectId: uuid("project_id").notNull(),
  action: text("action").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  ...auditColumns,
});

export type ProjectIssueActivity = typeof ProjectIssueActivities.$inferSelect;
export type NewProjectIssueActivity = typeof ProjectIssueActivities.$inferInsert;
