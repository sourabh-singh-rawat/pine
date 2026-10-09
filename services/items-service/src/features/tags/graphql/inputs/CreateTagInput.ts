import { builder } from "@pine/server";

export const CreateTagInput = builder.inputType("CreateTagInput", {
  fields: (t) => ({
    organizationId: t.string({ required: true }),
    spaceId: t.string({ required: false }),
    name: t.string({ required: true }),
    color: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});
