import Type from "typebox";

export const OrganizationUpdatedDataSchema = Type.Object(
  {
    id: Type.String(),
    tenantId: Type.String(),
    updatedAt: Type.String(),
    parentOrganizationId: Type.Optional(Type.String()),
    previousParentOrganizationId: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type OrganizationUpdatedData = Type.Static<typeof OrganizationUpdatedDataSchema>;
