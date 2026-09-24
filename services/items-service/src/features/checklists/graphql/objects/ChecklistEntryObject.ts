import { builder } from "@pine/server";
import type { ChecklistEntry } from "@/db";

export const ChecklistEntryObject = builder.objectRef<ChecklistEntry>(
  "ChecklistEntryObject",
);

ChecklistEntryObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    checklistId: t.exposeString("checklistId"),
    title: t.exposeString("title"),
    completed: t.exposeBoolean("completed"),
    orderIndex: t.exposeInt("orderIndex"),
    createdById: t.exposeString("createdById"),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
  }),
});
