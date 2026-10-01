import Type from "typebox";

export const OAuthClientParamsSchema = Type.Object({
  clientId: Type.String({ minLength: 1 }),
});

export type OAuthClientParams = Type.Static<typeof OAuthClientParamsSchema>;
