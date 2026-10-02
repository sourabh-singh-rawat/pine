import Type from "typebox";

export const ConsentQuerySchema = Type.Object(
  {
    consent_challenge: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export type ConsentQuery = Type.Static<typeof ConsentQuerySchema>;
