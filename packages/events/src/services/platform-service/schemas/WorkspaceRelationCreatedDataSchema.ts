import Type from "typebox";

export const WorkspaceRelationCreatedDataSchema = Type.Object(
  {
    id: Type.String(),
    workspaceId: Type.String(),
    identityId: Type.String(),
    relation: Type.String(),
    createdAt: Type.String(),
  },
  { additionalProperties: false },
);

export type WorkspaceRelationCreatedData = Type.Static<typeof WorkspaceRelationCreatedDataSchema>;
