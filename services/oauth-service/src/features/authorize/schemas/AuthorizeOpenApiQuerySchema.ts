import Type from "typebox";

export const AuthorizeOpenApiQuerySchema = Type.Object(
  {
    response_type: Type.Optional(Type.Literal("code")),
    client_id: Type.Optional(Type.String({ minLength: 1 })),
    redirect_uri: Type.Optional(Type.String({ minLength: 1 })),
    scope: Type.Optional(Type.String({ minLength: 1 })),
    state: Type.Optional(Type.String({ minLength: 1 })),
    code_challenge: Type.Optional(Type.String({ minLength: 1 })),
    code_challenge_method: Type.Optional(Type.Union([Type.Literal("S256"), Type.Literal("plain")])),
    nonce: Type.Optional(Type.String({ minLength: 1 })),
    login_verifier: Type.Optional(Type.String({ minLength: 1 })),
    consent_verifier: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: true },
);

export type AuthorizeOpenApiQuery = Type.Static<typeof AuthorizeOpenApiQuerySchema>;
