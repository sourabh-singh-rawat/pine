import Type from "typebox";

export const ItemCreatedDataSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    ownerId: Type.String(),
    reporterId: Type.String(),
    listId: Type.String(),
    createdAt: Type.String(),
    description: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type ItemCreatedData = Type.Static<typeof ItemCreatedDataSchema>;
