import Type from "typebox";

const OAuthClientDataSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  redirectUris: Type.Array(Type.String()),
  scopes: Type.Array(Type.String()),
  grantTypes: Type.Array(Type.String()),
});

export const OAuthClientResponseSchema = Type.Object(
  {
    data: OAuthClientDataSchema,
  },
  { additionalProperties: false },
);

export type OAuthClientResponse = Type.Static<typeof OAuthClientDataSchema>;
