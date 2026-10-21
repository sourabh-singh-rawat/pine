import Type from "typebox";

export const TenantSuspendedDataSchema = Type.Object(
  {
    id: Type.String(),
    platformId: Type.String(),
    suspendedAt: Type.String(),
  },
  { additionalProperties: false },
);

export type TenantSuspendedData = Type.Static<typeof TenantSuspendedDataSchema>;
