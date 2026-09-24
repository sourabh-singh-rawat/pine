import { builder } from "@pine/server";

export const CreateSpaceInput = builder.inputType("CreateSpaceInput", {
  fields: (t) => ({
    workspaceId: t.string({ required: true }),
    name: t.string({ required: true }),
  }),
});
