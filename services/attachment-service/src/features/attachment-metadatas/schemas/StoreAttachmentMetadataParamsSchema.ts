import Type from "typebox";

export const StoreAttachmentMetadataParamsSchema = Type.Object(
  {
    attachmentId: Type.String({ format: "uuid" }),
    versionId: Type.String({ format: "uuid" }),
  },
  { additionalProperties: false },
);

export type StoreAttachmentMetadataParams = Type.Static<typeof StoreAttachmentMetadataParamsSchema>;
