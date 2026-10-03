import Type from "typebox";

export const OpenIdConfigurationSchema = Type.Object(
  {
    issuer: Type.String(),
    authorization_endpoint: Type.String(),
    token_endpoint: Type.String(),
    jwks_uri: Type.String(),
    introspection_endpoint: Type.String(),
  },
  { additionalProperties: true },
);
