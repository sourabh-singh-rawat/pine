import { builder } from "@pine/server";

export const CreateOrganizationRelationInput = builder.inputType(
  "CreateOrganizationRelationInput",
  {
    fields: (t) => ({
      organizationId: t.string({ required: true }),
      relation: t.string({ required: true }),
      identityId: t.string({ required: true }),
    }),
  },
);
