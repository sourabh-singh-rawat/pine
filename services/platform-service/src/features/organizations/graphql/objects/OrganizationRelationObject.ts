import { builder } from "@pine/server";
import type { OrganizationRelation } from "@/features/organizations/services/IOrganizationRelationService";

export const OrganizationRelationObject = builder.objectRef<OrganizationRelation>(
  "OrganizationRelationObject",
);

OrganizationRelationObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    organizationId: t.exposeString("organizationId"),
    identityId: t.exposeString("identityId"),
    relation: t.exposeString("relation"),
  }),
});
