import Type from "typebox";

export const InitialAuthorizeQuerySchema = Type.Object(
  {
    response_type: Type.Literal("code"),
    client_id: Type.String({ minLength: 1 }),
    redirect_uri: Type.String({ minLength: 1 }),
    scope: Type.String({ minLength: 1 }),
    state: Type.String({ minLength: 1 }),
    code_challenge: Type.Optional(Type.String({ minLength: 1 })),
    code_challenge_method: Type.Optional(Type.Union([Type.Literal("S256"), Type.Literal("plain")])),
    nonce: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

export type InitialAuthorizeQuery = Type.Static<typeof InitialAuthorizeQuerySchema>;
