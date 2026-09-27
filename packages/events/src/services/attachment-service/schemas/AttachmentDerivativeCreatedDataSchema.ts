import Type from "typebox";

export const AttachmentDerivativeCreatedDataSchema = Type.Object(
  {
    derivativeId: Type.String(),
    attachmentId: Type.String(),
    versionId: Type.String(),
    derivativeType: Type.Union([Type.Literal("thumbnail"), Type.Literal("preview")]),
    mimeType: Type.String(),
    fileSize: Type.Number(),
    width: Type.Number(),
    height: Type.Number(),
    storageProvider: Type.String(),
    storageObjectKey: Type.String(),
    url: Type.Optional(Type.String()),
    createdAt: Type.String(),
  },
  { additionalProperties: false },
);

export type AttachmentDerivativeCreatedData = Type.Static<
  typeof AttachmentDerivativeCreatedDataSchema
>;
