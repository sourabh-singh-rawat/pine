import Type from "typebox";

export const OrganizationMemberCreatedDataSchema = Type.Object(
  {
    id: Type.String(),
    organizationId: Type.String(),
    identityId: Type.String(),
    role: Type.String(),
    createdAt: Type.String(),
  },
  { additionalProperties: false },
);

export type OrganizationMemberCreatedData = Type.Static<typeof OrganizationMemberCreatedDataSchema>;
