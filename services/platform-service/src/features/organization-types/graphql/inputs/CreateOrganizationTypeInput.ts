import { builder } from "@pine/server";

export const CreateOrganizationTypeInput = builder.inputType("CreateOrganizationTypeInput", {
  fields: (t) => ({
    tenantId: t.string({ required: true }),
    parentOrganizationTypeId: t.string({ required: false }),
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
    description: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});
