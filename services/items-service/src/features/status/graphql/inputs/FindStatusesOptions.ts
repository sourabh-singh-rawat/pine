import { builder } from "@pine/server";

export const FindStatusesOptions = builder.inputType("FindStatusesOptions", {
  fields: (t) => ({
    projectId: t.string({ required: true }),
  }),
});
