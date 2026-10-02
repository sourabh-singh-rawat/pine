import Type from "typebox";

export const ConsentActionResponseSchema = Type.Object(
  {
    redirectTo: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export type ConsentActionResponse = Type.Static<typeof ConsentActionResponseSchema>;
