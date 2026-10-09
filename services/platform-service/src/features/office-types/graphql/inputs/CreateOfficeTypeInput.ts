import { builder } from "@pine/server";

export const CreateOfficeTypeInput = builder.inputType("CreateOfficeTypeInput", {
  fields: (t) => ({
    tenantId: t.string({ required: true }),
    parentOfficeTypeId: t.string({ required: false }),
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
    description: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});
