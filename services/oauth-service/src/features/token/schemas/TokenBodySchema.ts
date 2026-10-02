import Type from "typebox";

export const TokenBodySchema = Type.Object(
  {
    grant_type: Type.Literal("authorization_code"),
    code: Type.String({ minLength: 1 }),
    client_id: Type.String({ minLength: 1 }),
    redirect_uri: Type.String({ minLength: 1 }),
    code_verifier: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export type TokenBody = Type.Static<typeof TokenBodySchema>;
