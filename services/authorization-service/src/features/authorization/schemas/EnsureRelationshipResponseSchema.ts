import Type from "typebox";

const EnsureRelationshipDataSchema = Type.Object(
  {
    created: Type.Boolean(),
  },
  { additionalProperties: false },
);

export const EnsureRelationshipResponseSchema = Type.Object(
  {
    data: EnsureRelationshipDataSchema,
  },
  { additionalProperties: false },
);

export type EnsureRelationshipResponse = Type.Static<typeof EnsureRelationshipDataSchema>;
