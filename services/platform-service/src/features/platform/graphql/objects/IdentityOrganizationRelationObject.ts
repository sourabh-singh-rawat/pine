import { builder } from "@pine/server";
import type { IdentityOrganizationRelation } from "@/features/platform/services/IIdentityRelationService";

export const IdentityOrganizationRelationObject = builder.objectRef<IdentityOrganizationRelation>(
  "IdentityOrganizationRelationObject",
);

IdentityOrganizationRelationObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    organizationId: t.exposeString("organizationId"),
    identityId: t.exposeString("identityId"),
    relation: t.exposeString("relation"),
  }),
});
