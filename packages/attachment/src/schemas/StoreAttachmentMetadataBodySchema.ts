import Type from "typebox";

export const StoreAttachmentMetadataBodySchema = Type.Object(
  {
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

export type StoreAttachmentMetadataBody = Type.Static<typeof StoreAttachmentMetadataBodySchema>;
