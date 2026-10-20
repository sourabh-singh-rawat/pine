import { builder } from "@pine/server";
import type { IdentityTenantRelation } from "@/features/platform/services/IIdentityRelationService";

export const IdentityTenantRelationObject = builder.objectRef<IdentityTenantRelation>(
  "IdentityTenantRelationObject",
);

IdentityTenantRelationObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    tenantId: t.exposeString("tenantId"),
    identityId: t.exposeString("identityId"),
    relation: t.exposeString("relation"),
  }),
});
