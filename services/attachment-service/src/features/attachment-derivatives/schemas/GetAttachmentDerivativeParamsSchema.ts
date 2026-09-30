import Type from "typebox";

export const GetAttachmentDerivativeParamsSchema = Type.Object(
  {
    attachmentId: Type.String(),
    derivativeType: Type.Union([Type.Literal("thumbnail"), Type.Literal("preview")]),
  },
  { additionalProperties: false },
);

export type GetAttachmentDerivativeParams = Type.Static<typeof GetAttachmentDerivativeParamsSchema>;
