import Type from "typebox";

export const ProjectMemberDataSchema = Type.Object(
  {
    userId: Type.String(),
    projectId: Type.String(),
    role: Type.String(),
    createdBy: Type.String(),
  },
  { additionalProperties: false },
);

export type ProjectMemberData = Type.Static<typeof ProjectMemberDataSchema>;
