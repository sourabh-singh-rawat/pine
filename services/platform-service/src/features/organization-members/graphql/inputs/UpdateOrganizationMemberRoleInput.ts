import { builder } from "@pine/server";

export const UpdateOrganizationMemberRoleInput = builder.inputType(
  "UpdateOrganizationMemberRoleInput",
  {
    fields: (t) => ({
      id: t.string({ required: true }),
      role: t.string({ required: true }),
    }),
  },
);
