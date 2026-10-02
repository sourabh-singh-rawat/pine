import Type from "typebox";

const AcceptLoginDataSchema = Type.Object(
  {
    redirectTo: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const AcceptLoginResponseSchema = Type.Object(
  {
    data: AcceptLoginDataSchema,
  },
  { additionalProperties: false },
);

export type AcceptLoginResponse = Type.Static<typeof AcceptLoginDataSchema>;
