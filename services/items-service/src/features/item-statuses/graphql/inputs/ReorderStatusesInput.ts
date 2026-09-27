import { builder } from "@pine/server";

export const ReorderStatusesInput = builder.inputType("ReorderStatusesInput", {
  fields: (t) => ({
    listId: t.id({ required: true }),
    statusIds: t.stringList({ required: true }),
  }),
});
