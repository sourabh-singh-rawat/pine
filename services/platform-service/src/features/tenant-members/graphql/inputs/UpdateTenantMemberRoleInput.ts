import { builder } from "@pine/server";

export const UpdateTenantMemberRoleInput = builder.inputType("UpdateTenantMemberRoleInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    role: t.string({ required: true }),
  }),
});
