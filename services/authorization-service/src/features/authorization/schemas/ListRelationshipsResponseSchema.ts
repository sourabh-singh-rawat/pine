import Type from "typebox";
import { GraphRelationshipBodySchema } from "@/features/authorization/schemas/GraphRelationshipBodySchema";

const ListRelationshipsDataSchema = Type.Object(
  {
    relationships: Type.Array(GraphRelationshipBodySchema),
  },
  { additionalProperties: false },
);

export const ListRelationshipsResponseSchema = Type.Object(
  {
    data: ListRelationshipsDataSchema,
  },
  { additionalProperties: false },
);

export type ListRelationshipsResponse = Type.Static<typeof ListRelationshipsDataSchema>;
