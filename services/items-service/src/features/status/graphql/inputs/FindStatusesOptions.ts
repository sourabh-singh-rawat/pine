import { builder } from "@pine/server";

export const FindStatusesOptions = builder.inputType("FindStatusesOptions", {
  fields: (t) => ({
    listId: t.string({ required: true }),
  }),
});
