import { builder } from "@pine/server";

export const CreateSpaceInput = builder.inputType("CreateSpaceInput", {
  fields: (t) => ({
    organizationId: t.string({ required: true }),
    name: t.string({ required: true }),
  }),
});
