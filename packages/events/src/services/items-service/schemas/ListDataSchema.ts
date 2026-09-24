import Type from "typebox";

export const ListDataSchema = Type.Object(
  {
    id: Type.String(),
    spaceId: Type.String(),
    name: Type.String(),
    status: Type.String(),
    ownerUserId: Type.String(),
    createdAt: Type.String(),
    description: Type.Optional(Type.String()),
    startDate: Type.Optional(Type.String()),
    endDate: Type.Optional(Type.String()),
    updatedAt: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type ListData = Type.Static<typeof ListDataSchema>;
