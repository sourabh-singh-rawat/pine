import Type from "typebox";

export const OrganizationRelationCreatedDataSchema = Type.Object(
  {
    id: Type.String(),
    organizationId: Type.String(),
    identityId: Type.String(),
    relation: Type.String(),
    createdAt: Type.String(),
  },
  { additionalProperties: false },
);

export type OrganizationRelationCreatedData = Type.Static<
  typeof OrganizationRelationCreatedDataSchema
>;
