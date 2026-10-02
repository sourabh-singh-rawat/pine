import Type from "typebox";

const UploadAttachmentDataSchema = Type.Object(
  {
    status: Type.String(),
  },
  { additionalProperties: false },
);

export const UploadAttachmentResponseSchema = Type.Object(
  {
    data: UploadAttachmentDataSchema,
  },
  { additionalProperties: false },
);

export type UploadAttachmentResponse = Type.Static<typeof UploadAttachmentDataSchema>;
