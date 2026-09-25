import { builder } from "@pine/server";

export const ReorderChecklistEntriesInput = builder.inputType("ReorderChecklistEntriesInput", {
  fields: (t) => ({
    checklistId: t.string({ required: true }),
    ids: t.stringList({ required: true }),
  }),
});
