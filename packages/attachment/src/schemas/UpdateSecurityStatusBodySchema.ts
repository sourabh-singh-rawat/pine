import Type from "typebox";

export const UpdateSecurityStatusBodySchema = Type.Object(
  {
    status: Type.Union([Type.Literal("CLEAN"), Type.Literal("INFECTED"), Type.Literal("FAILED")]),
  },
  { additionalProperties: false },
);

export type UpdateSecurityStatusBody = Type.Static<typeof UpdateSecurityStatusBodySchema>;
