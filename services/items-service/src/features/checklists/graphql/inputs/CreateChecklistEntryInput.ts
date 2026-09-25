import { builder } from "@pine/server";

export const CreateChecklistEntryInput = builder.inputType("CreateChecklistEntryInput", {
  fields: (t) => ({
    checklistId: t.string({ required: true }),
    title: t.string({ required: true }),
  }),
});
