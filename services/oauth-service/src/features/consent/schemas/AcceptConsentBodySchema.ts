import Type from "typebox";

export const AcceptConsentBodySchema = Type.Object(
  {
    grantScope: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
    remember: Type.Optional(Type.Boolean()),
    rememberFor: Type.Optional(Type.Integer({ minimum: 0 })),
  },
  { additionalProperties: false },
);

export type AcceptConsentBody = Type.Static<typeof AcceptConsentBodySchema>;
