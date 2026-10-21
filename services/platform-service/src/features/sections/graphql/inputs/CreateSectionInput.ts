import { builder } from "@pine/server";

export const CreateSectionInput = builder.inputType("CreateSectionInput", {
  fields: (t) => ({
    tenantId: t.string({ required: true }),
    organizationId: t.string({ required: true }),
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
    description: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});
