import Type from "typebox";

const UpdateSecurityStatusDataSchema = Type.Object(
  {
    attachmentId: Type.String(),
    status: Type.String(),
    securityStatus: Type.String(),
  },
  { additionalProperties: false },
);

export const UpdateSecurityStatusResponseSchema = Type.Object(
  {
    data: UpdateSecurityStatusDataSchema,
  },
  { additionalProperties: false },
);

export type UpdateSecurityStatusResponse = Type.Static<typeof UpdateSecurityStatusDataSchema>;
