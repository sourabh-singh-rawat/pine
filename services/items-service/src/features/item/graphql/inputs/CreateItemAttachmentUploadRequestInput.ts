import { builder } from "@pine/server";

export const CreateItemAttachmentUploadRequestInput = builder.inputType(
  "CreateItemAttachmentUploadRequestInput",
  {
    fields: (t) => ({
      itemId: t.string({ required: true }),
      filename: t.string({ required: true }),
      contentType: t.string({ required: true }),
      size: t.int({ required: true }),
    }),
  },
);
