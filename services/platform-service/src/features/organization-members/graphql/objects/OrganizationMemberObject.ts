import { builder } from "@pine/server";
import type { OrganizationMember } from "@/db";

export const OrganizationMemberObject = builder.objectRef<OrganizationMember>(
  "OrganizationMemberObject",
);

OrganizationMemberObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    organizationId: t.exposeString("organizationId"),
    identityId: t.exposeString("identityId"),
    role: t.exposeString("role"),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
