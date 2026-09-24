import { builder } from "@pine/server";

export const CreateChecklistInput = builder.inputType("CreateChecklistInput", {
  fields: (t) => ({
    itemId: t.string({ required: true }),
    name: t.string({ required: false }),
  }),
});
