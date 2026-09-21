import Type from "typebox";

export const IssueUpdatedDataSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    ownerId: Type.String(),
    reporterId: Type.String(),
    projectId: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    updatedById: Type.String(),
    description: Type.Optional(Type.String()),
    statusId: Type.Optional(Type.String()),
    priority: Type.Optional(Type.String()),
    type: Type.Optional(Type.String()),
    dueDate: Type.Optional(Type.String()),
    estimate: Type.Optional(Type.Number()),
    component: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type IssueUpdatedData = Type.Static<typeof IssueUpdatedDataSchema>;
