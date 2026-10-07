import Type from "typebox";

export const LoginVerifierAuthorizeQuerySchema = Type.Object(
  {
    login_verifier: Type.String({ minLength: 1 }),
  },
  { additionalProperties: true },
);

export type LoginVerifierAuthorizeQuery = Type.Static<typeof LoginVerifierAuthorizeQuerySchema>;
