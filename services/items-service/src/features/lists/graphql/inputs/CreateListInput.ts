import { builder } from "@pine/server";

export const CreateListInput = builder.inputType("CreateListInput", {
  fields: (t) => ({
    spaceId: t.string({ required: true }),
    name: t.string({ required: true }),
  }),
});
