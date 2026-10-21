import Type from "typebox";

export const OrganizationMemberDeletedDataSchema = Type.Object(
  {
    id: Type.String(),
    organizationId: Type.String(),
    identityId: Type.String(),
    role: Type.String(),
  },
  { additionalProperties: false },
);

export type OrganizationMemberDeletedData = Type.Static<typeof OrganizationMemberDeletedDataSchema>;
