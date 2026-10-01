import Type from "typebox";

const ConsentClientSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    name: Type.Optional(Type.String()),
    redirectUris: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
);

export const ConsentResponseSchema = Type.Object(
  {
    challenge: Type.String({ minLength: 1 }),
    skip: Type.Boolean(),
    subject: Type.Optional(Type.String()),
    client: ConsentClientSchema,
    requestedScope: Type.Array(Type.String()),
    requestUrl: Type.Optional(Type.String()),
    loginChallenge: Type.Optional(Type.String()),
    loginSessionId: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type ConsentResponse = Type.Static<typeof ConsentResponseSchema>;
