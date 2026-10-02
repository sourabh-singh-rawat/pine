import Type from "typebox";

const ConsentActionDataSchema = Type.Object(
  {
    redirectTo: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const ConsentActionResponseSchema = Type.Object(
  {
    data: ConsentActionDataSchema,
  },
  { additionalProperties: false },
);

export type ConsentActionResponse = Type.Static<typeof ConsentActionDataSchema>;
