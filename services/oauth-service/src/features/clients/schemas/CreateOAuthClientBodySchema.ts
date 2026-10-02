import Type from "typebox";

export const CreateOAuthClientBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  redirectUris: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  scopes: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  grantTypes: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});

export type CreateOAuthClientBody = Type.Static<typeof CreateOAuthClientBodySchema>;
