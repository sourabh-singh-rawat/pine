import Type from "typebox";

export const TenantMemberCreatedDataSchema = Type.Object(
  {
    id: Type.String(),
    tenantId: Type.String(),
    identityId: Type.String(),
    role: Type.String(),
    createdAt: Type.String(),
  },
  { additionalProperties: false },
);

export type TenantMemberCreatedData = Type.Static<typeof TenantMemberCreatedDataSchema>;
