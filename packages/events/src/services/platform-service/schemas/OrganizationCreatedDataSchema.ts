import Type from "typebox";

export const OrganizationCreatedDataSchema = Type.Object(
  {
    id: Type.String(),
    tenantId: Type.String(),
    name: Type.String(),
    slug: Type.String(),
    isActive: Type.Boolean(),
    version: Type.Integer({ minimum: 1 }),
    createdAt: Type.String(),
    description: Type.Optional(Type.String()),
    parentOrganizationId: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type OrganizationCreatedData = Type.Static<typeof OrganizationCreatedDataSchema>;
