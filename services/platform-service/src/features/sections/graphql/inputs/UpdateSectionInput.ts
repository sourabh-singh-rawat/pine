import { builder } from "@pine/server";

export const UpdateSectionInput = builder.inputType("UpdateSectionInput", {
  fields: (t) => ({
    name: t.string({ required: false }),
    slug: t.string({ required: false }),
    description: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});
