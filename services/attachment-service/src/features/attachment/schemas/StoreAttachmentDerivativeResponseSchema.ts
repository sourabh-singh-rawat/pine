import Type from "typebox";

export const StoreAttachmentDerivativeHeadersSchema = Type.Object({
  "content-type": Type.String({ minLength: 1 }),
  "x-image-width": Type.Optional(Type.String()),
  "x-image-height": Type.Optional(Type.String()),
});

export type StoreAttachmentDerivativeHeaders = Type.Static<
  typeof StoreAttachmentDerivativeHeadersSchema
>;

export const StoreAttachmentDerivativeResponseSchema = Type.Object(
  {
    derivativeId: Type.String(),
    attachmentId: Type.String(),
    versionId: Type.String(),
    derivativeType: Type.String(),
    mimeType: Type.String(),
    fileSize: Type.Number(),
    width: Type.Number(),
    height: Type.Number(),
  },
  { additionalProperties: false },
);

export type StoreAttachmentDerivativeResponse = Type.Static<
  typeof StoreAttachmentDerivativeResponseSchema
>;
