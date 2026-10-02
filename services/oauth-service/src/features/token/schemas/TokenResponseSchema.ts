import Type from "typebox";

const TokenDataSchema = Type.Object(
  {
    message: Type.String(),
  },
  { additionalProperties: false },
);

export const TokenResponseSchema = Type.Object(
  {
    data: TokenDataSchema,
  },
  { additionalProperties: false },
);

export type TokenResponse = Type.Static<typeof TokenDataSchema>;
