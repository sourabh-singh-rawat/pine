import Type from "typebox";

export const RejectConsentBodySchema = Type.Object(
  {
    error: Type.Optional(Type.String({ minLength: 1 })),
    errorDescription: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

export type RejectConsentBody = Type.Static<typeof RejectConsentBodySchema>;
