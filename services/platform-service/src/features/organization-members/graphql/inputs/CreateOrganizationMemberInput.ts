import { builder } from "@pine/server";

export const CreateOrganizationMemberInput = builder.inputType("CreateOrganizationMemberInput", {
  fields: (t) => ({
    organizationId: t.string({ required: true }),
    identityId: t.string({ required: true }),
    role: t.string({ required: true }),
  }),
});
