import Type from "typebox";

const IntrospectTokenDataSchema = Type.Object({
  active: Type.Boolean(),
  subject: Type.Optional(Type.String()),
  clientId: Type.Optional(Type.String()),
  scope: Type.Optional(Type.String()),
  expiresAt: Type.Optional(Type.String({ format: "date-time" })),
  issuedAt: Type.Optional(Type.String({ format: "date-time" })),
  audience: Type.Optional(Type.Array(Type.String())),
  extra: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});

export const IntrospectTokenResponseSchema = Type.Object(
  {
    data: IntrospectTokenDataSchema,
  },
  { additionalProperties: false },
);

export type IntrospectTokenResponse = Type.Static<typeof IntrospectTokenDataSchema>;
