import { builder } from "@pine/server";

export const UpdateChecklistEntryInput = builder.inputType(
  "UpdateChecklistEntryInput",
  {
    fields: (t) => ({
      id: t.string({ required: true }),
      title: t.string({ required: false }),
      completed: t.boolean({ required: false }),
    }),
  },
);
