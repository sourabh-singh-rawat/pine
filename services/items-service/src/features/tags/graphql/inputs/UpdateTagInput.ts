import { builder } from "@pine/server";

export const UpdateTagInput = builder.inputType("UpdateTagInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: false }),
    color: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});
