import { builder } from "@pine/server";

export const CreateProjectInput = builder.inputType("CreateProjectInput", {
  fields: (t) => ({
    spaceId: t.string({ required: true }),
    name: t.string({ required: true }),
  }),
});
