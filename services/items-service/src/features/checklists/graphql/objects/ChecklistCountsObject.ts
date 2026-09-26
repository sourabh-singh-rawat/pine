import { builder } from "@pine/server";

export type ChecklistCountsObjectShape = {
  completedCount: number;
  totalCount: number;
};

export const ChecklistCountsObject =
  builder.objectRef<ChecklistCountsObjectShape>("ChecklistCountsObject");

ChecklistCountsObject.implement({
  fields: (t) => ({
    completedCount: t.exposeInt("completedCount"),
    totalCount: t.exposeInt("totalCount"),
  }),
});
