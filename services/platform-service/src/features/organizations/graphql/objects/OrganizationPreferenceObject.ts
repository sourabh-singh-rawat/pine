import { builder } from "@pine/server";
import type { IdentityOrganizationPreference } from "@/db";

export const OrganizationPreferenceObject = builder.objectRef<IdentityOrganizationPreference>(
  "OrganizationPreferenceObject",
);

OrganizationPreferenceObject.implement({
  fields: (t) => ({
    organizationId: t.exposeString("organizationId"),
    tenantId: t.exposeString("tenantId"),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
