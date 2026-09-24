import { builder } from "@pine/server";

export const CreateItemAttachmentInput = builder.inputType("CreateItemAttachmentInput", {
  fields: (t) => ({
    itemId: t.string({ required: true }),
    attachmentId: t.string({ required: true }),
    name: t.string({ required: true }),
    originalName: t.string({ required: true }),
    mimeType: t.string({ required: true }),
    size: t.int({ required: false }),
  }),
});
