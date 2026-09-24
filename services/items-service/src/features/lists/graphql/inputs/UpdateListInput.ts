import { builder } from "@pine/server";

export const UpdateListInput = builder.inputType("UpdateListInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: true }),
  }),
});
