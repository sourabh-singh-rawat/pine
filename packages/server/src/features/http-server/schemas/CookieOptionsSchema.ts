import Type from "typebox";

export const CookieOptionsSchema = Type.Object(
  {
    secret: Type.Optional(Type.String()),
    path: Type.Optional(Type.String()),
    httpOnly: Type.Optional(Type.Boolean()),
    sameSite: Type.Optional(Type.Boolean()),
    secure: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export type CookieOptions = Type.Static<typeof CookieOptionsSchema>;
