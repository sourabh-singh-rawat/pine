import { builder } from "@pine/server";

export const GetSubItemsInput = builder.inputType("GetSubItemsInput", {
  fields: (t) => ({
    parentItemId: t.string({ required: true }),
  }),
});
