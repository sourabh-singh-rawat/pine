import Type from "typebox";

export const ConsentVerifierAuthorizeQuerySchema = Type.Object(
  {
    consent_verifier: Type.String({ minLength: 1 }),
  },
  { additionalProperties: true },
);

export type ConsentVerifierAuthorizeQuery = Type.Static<typeof ConsentVerifierAuthorizeQuerySchema>;
