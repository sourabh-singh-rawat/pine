import { builder } from "@pine/server";
import type { ChecklistEntry } from "@/db";
import type { ChecklistWithEntries } from "@/features/checklists/services";
import { ChecklistEntryObject } from "./ChecklistEntryObject";

export type ChecklistObjectShape = {
  id: string;
  itemId: string;
  name: string;
  createdById: string;
  createdAt: Date;
  completedCount: number;
  totalCount: number;
  entries: ChecklistEntry[];
};

export const toChecklistObjectShape = (
  row: ChecklistWithEntries,
): ChecklistObjectShape => ({
  id: row.checklist.id,
  itemId: row.checklist.itemId,
  name: row.checklist.name,
  createdById: row.checklist.createdById,
  createdAt: row.checklist.createdAt,
  completedCount: row.completedCount,
  totalCount: row.totalCount,
  entries: row.entries,
});

export const ChecklistObject = builder.objectRef<ChecklistObjectShape>(
  "ChecklistObject",
);

ChecklistObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    itemId: t.exposeString("itemId"),
    name: t.exposeString("name"),
    createdById: t.exposeString("createdById"),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    completedCount: t.exposeInt("completedCount"),
    totalCount: t.exposeInt("totalCount"),
    entries: t.field({
      type: [ChecklistEntryObject],
      resolve: (parent) => parent.entries,
    }),
  }),
});
