import { builder } from "@pine/server";

export const DeleteStatusInput = builder.inputType("DeleteStatusInput", {
  fields: (t) => ({
    id: t.id({ required: true }),
    replacementStatusId: t.id({ required: false }),
  }),
});
