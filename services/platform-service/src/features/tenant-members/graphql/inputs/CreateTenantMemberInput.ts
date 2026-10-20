import { builder } from "@pine/server";

export const CreateTenantMemberInput = builder.inputType("CreateTenantMemberInput", {
  fields: (t) => ({
    tenantId: t.string({ required: true }),
    identityId: t.string({ required: true }),
    role: t.string({ required: true }),
  }),
});
