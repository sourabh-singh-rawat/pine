import { builder } from "@pine/server";

export const GetTagsInput = builder.inputType("GetTagsInput", {
  fields: (t) => ({
    workspaceId: t.string({ required: true }),
    spaceId: t.string({ required: false }),
  }),
});
