import { builder } from "@pine/server";

export const UpdateStatusInput = builder.inputType("UpdateStatusInput", {
  fields: (t) => ({
    id: t.id({ required: true }),
    name: t.string({ required: false }),
    type: t.string({ required: false }),
    color: t.string({ required: false }),
  }),
});
