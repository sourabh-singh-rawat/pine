import Type from "typebox";

export const StoreAttachmentDerivativeParamsSchema = Type.Object(
  {
    attachmentId: Type.String({ format: "uuid" }),
    versionId: Type.String({ format: "uuid" }),
    derivativeType: Type.Union([Type.Literal("thumbnail"), Type.Literal("preview")]),
  },
  { additionalProperties: false },
);

export type StoreAttachmentDerivativeParams = Type.Static<
  typeof StoreAttachmentDerivativeParamsSchema
>;
