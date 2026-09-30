import Type from "typebox";

export const StoreDerivativeResultSchema = Type.Object(
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

export type StoreDerivativeResult = Type.Static<typeof StoreDerivativeResultSchema>;
