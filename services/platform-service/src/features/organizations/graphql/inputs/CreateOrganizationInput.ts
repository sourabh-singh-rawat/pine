import { builder } from "@pine/server";

export const CreateOrganizationInput = builder.inputType("CreateOrganizationInput", {
  fields: (t) => ({
    tenantId: t.string({ required: true }),
    parentOrganizationId: t.string({ required: false }),
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
    description: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});
