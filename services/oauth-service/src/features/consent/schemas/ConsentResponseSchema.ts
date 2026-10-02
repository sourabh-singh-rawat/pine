import Type from "typebox";

const ConsentClientSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    name: Type.Optional(Type.String()),
    redirectUris: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
);

export const ConsentScopeDetailSchema = Type.Object(
  {
    scope: Type.String({ minLength: 1 }),
    title: Type.String(),
    description: Type.String(),
  },
  { additionalProperties: false },
);

const ConsentDataSchema = Type.Object(
  {
    challenge: Type.String({ minLength: 1 }),
    skip: Type.Boolean(),
    subject: Type.Optional(Type.String()),
    client: ConsentClientSchema,
    requestedScope: Type.Array(Type.String()),
    scopes: Type.Array(ConsentScopeDetailSchema),
    loginChallenge: Type.Optional(Type.String()),
    loginSessionId: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const ConsentResponseSchema = Type.Object(
  {
    data: ConsentDataSchema,
  },
  { additionalProperties: false },
);

export type ConsentScopeDetail = Type.Static<typeof ConsentScopeDetailSchema>;
export type ConsentResponse = Type.Static<typeof ConsentDataSchema>;
