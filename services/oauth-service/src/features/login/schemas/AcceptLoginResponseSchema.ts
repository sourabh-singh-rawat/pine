import Type from "typebox";

export const AcceptLoginResponseSchema = Type.Object(
  {
    redirectTo: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export type AcceptLoginResponse = Type.Static<typeof AcceptLoginResponseSchema>;
