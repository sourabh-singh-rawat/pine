import { builder } from "@pine/server";

export const UpdateChecklistInput = builder.inputType("UpdateChecklistInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: true }),
  }),
});
