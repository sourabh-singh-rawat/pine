import { builder } from "@pine/server";

export const ReorderListItemsInput = builder.inputType("ReorderListItemsInput", {
  fields: (t) => ({
    listId: t.id({ required: true }),
    statusId: t.id({ required: true }),
    itemIds: t.stringList({ required: true }),
  }),
});
