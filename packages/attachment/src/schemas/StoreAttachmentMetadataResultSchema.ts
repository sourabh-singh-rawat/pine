import Type from "typebox";

export const StoreAttachmentMetadataResultSchema = Type.Object(
  {
    metadataId: Type.String(),
    attachmentId: Type.String(),
    versionId: Type.String(),
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
    format: Type.Optional(Type.String()),
    space: Type.Optional(Type.String()),
    channels: Type.Optional(Type.Number()),
    density: Type.Optional(Type.Number()),
    hasAlpha: Type.Optional(Type.Boolean()),
    orientation: Type.Optional(Type.Number()),
    extractedAt: Type.String(),
  },
  { additionalProperties: false },
);

export type StoreAttachmentMetadataResult = Type.Static<typeof StoreAttachmentMetadataResultSchema>;
