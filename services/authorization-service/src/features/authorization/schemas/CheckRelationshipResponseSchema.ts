import Type from "typebox";

const CheckRelationshipDataSchema = Type.Object(
  {
    allowed: Type.Boolean(),
  },
  { additionalProperties: false },
);

export const CheckRelationshipResponseSchema = Type.Object(
  {
    data: CheckRelationshipDataSchema,
  },
  { additionalProperties: false },
);

export type CheckRelationshipResponse = Type.Static<typeof CheckRelationshipDataSchema>;
