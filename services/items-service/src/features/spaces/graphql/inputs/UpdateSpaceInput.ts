import { builder } from "@pine/server";

export const UpdateSpaceInput = builder.inputType("UpdateSpaceInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: true }),
  }),
});
