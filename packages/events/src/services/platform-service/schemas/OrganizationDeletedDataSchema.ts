import Type from "typebox";

export const OrganizationDeletedDataSchema = Type.Object(
  {
    id: Type.String(),
    tenantId: Type.String(),
    deletedAt: Type.String(),
    parentOrganizationId: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type OrganizationDeletedData = Type.Static<typeof OrganizationDeletedDataSchema>;
