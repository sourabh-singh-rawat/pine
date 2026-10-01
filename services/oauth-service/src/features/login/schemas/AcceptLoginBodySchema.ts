import Type from "typebox";

export const AcceptLoginBodySchema = Type.Object({
  challenge: Type.String({ minLength: 1 }),
  subject: Type.String({ minLength: 1 }),
  remember: Type.Optional(Type.Boolean()),
  rememberFor: Type.Optional(Type.Integer({ minimum: 0 })),
  identityProviderSessionId: Type.Optional(Type.String({ minLength: 1 })),
});

export type AcceptLoginBody = Type.Static<typeof AcceptLoginBodySchema>;
