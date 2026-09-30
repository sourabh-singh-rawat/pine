import Type from "typebox";

export const UpdateSecurityStatusParamsSchema = Type.Object(
  {
    attachmentId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export type UpdateSecurityStatusParams = Type.Static<typeof UpdateSecurityStatusParamsSchema>;
