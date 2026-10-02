import Type from "typebox";

const StoreAttachmentMetadataDataSchema = Type.Object(
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

export const StoreAttachmentMetadataResponseSchema = Type.Object(
  {
    data: StoreAttachmentMetadataDataSchema,
  },
  { additionalProperties: false },
);

export type StoreAttachmentMetadataResponse = Type.Static<typeof StoreAttachmentMetadataDataSchema>;
