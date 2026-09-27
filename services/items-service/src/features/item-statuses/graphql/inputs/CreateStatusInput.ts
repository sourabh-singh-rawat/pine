import { builder } from "@pine/server";

export const CreateStatusInput = builder.inputType("CreateStatusInput", {
  fields: (t) => ({
    listId: t.id({ required: true }),
    name: t.string({ required: true }),
    type: t.string({ required: true }),
    color: t.string({ required: true }),
  }),
});
