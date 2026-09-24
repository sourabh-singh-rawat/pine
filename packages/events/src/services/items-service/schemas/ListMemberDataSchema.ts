import Type from "typebox";

export const ListMemberDataSchema = Type.Object(
  {
    userId: Type.String(),
    listId: Type.String(),
    role: Type.String(),
    createdBy: Type.String(),
  },
  { additionalProperties: false },
);

export type ListMemberData = Type.Static<typeof ListMemberDataSchema>;
