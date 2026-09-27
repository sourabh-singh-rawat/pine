import Type from "typebox";

export const UpdateSecurityStatusResponseSchema = Type.Object(
  {
    attachmentId: Type.String(),
    status: Type.String(),
    securityStatus: Type.String(),
  },
  { additionalProperties: false },
);

export type UpdateSecurityStatusResponse = Type.Static<typeof UpdateSecurityStatusResponseSchema>;
