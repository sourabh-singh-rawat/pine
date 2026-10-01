import Type from "typebox";

export const OAuthClientResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  redirectUris: Type.Array(Type.String()),
  scopes: Type.Array(Type.String()),
  grantTypes: Type.Array(Type.String()),
});

export type OAuthClientResponse = Type.Static<typeof OAuthClientResponseSchema>;
