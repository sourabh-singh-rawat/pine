import Type from "typebox";

export const UpdateSecurityStatusResultSchema = Type.Object(
  {
    attachmentId: Type.String(),
    status: Type.String(),
    securityStatus: Type.String(),
  },
  { additionalProperties: false },
);

export type UpdateSecurityStatusResult = Type.Static<typeof UpdateSecurityStatusResultSchema>;
