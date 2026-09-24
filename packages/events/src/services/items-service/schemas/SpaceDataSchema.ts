import Type from "typebox";

export const SpaceDataSchema = Type.Object(
  {
    id: Type.String(),
    workspaceId: Type.String(),
    name: Type.String(),
    createdById: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type SpaceData = Type.Static<typeof SpaceDataSchema>;
