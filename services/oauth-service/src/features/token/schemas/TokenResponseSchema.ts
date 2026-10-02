import Type from "typebox";

export const TokenResponseSchema = Type.Object(
  {
    message: Type.String(),
  },
  { additionalProperties: false },
);

export type TokenResponse = Type.Static<typeof TokenResponseSchema>;
