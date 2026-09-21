import { integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const idColumn = {
  id: uuid("id").primaryKey().notNull(),
};

export const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
};
