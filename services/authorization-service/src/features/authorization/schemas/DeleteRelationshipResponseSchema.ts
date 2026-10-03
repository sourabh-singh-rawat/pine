import Type from "typebox";

const DeleteRelationshipDataSchema = Type.Object(
  {
    deleted: Type.Boolean(),
  },
  { additionalProperties: false },
);

export const DeleteRelationshipResponseSchema = Type.Object(
  {
    data: DeleteRelationshipDataSchema,
  },
  { additionalProperties: false },
);

export type DeleteRelationshipResponse = Type.Static<typeof DeleteRelationshipDataSchema>;
