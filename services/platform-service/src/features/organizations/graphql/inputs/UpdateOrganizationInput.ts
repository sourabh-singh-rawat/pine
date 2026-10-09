import { builder } from "@pine/server";

export const UpdateOrganizationInput = builder.inputType("UpdateOrganizationInput", {
  fields: (t) => ({
    parentOrganizationId: t.string({ required: false }),
  }),
});
