import { builder } from "@pine/server";

export const CreatePhotoUploadRequestInput = builder.inputType("CreatePhotoUploadRequestInput", {
  fields: (t) => ({
    filename: t.string({ required: true }),
    contentType: t.string({ required: true }),
    size: t.int({ required: true }),
  }),
});
