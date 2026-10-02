import { builder } from "@pine/server";

export const SetItemTagsInput = builder.inputType("SetItemTagsInput", {
  fields: (t) => ({
    itemId: t.string({ required: true }),
    tagIds: t.stringList({ required: true }),
  }),
});
