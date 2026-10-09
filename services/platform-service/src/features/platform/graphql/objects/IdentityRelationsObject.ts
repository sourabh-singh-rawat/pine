import { builder } from "@pine/server";
import { OrganizationRelationObject } from "@/features/organizations/graphql/objects/OrganizationRelationObject";
import type { IdentityRelations } from "@/features/platform/services/IIdentityRelationService";
import { PlatformRelationObject } from "@/features/platform/graphql/objects/PlatformRelationObject";
import { TenantRelationObject } from "@/features/tenants/graphql/objects/TenantRelationObject";

export const IdentityRelationsObject =
  builder.objectRef<IdentityRelations>("IdentityRelationsObject");

IdentityRelationsObject.implement({
  fields: (t) => ({
    identityId: t.exposeString("identityId"),
    platform: t.field({
      type: [PlatformRelationObject],
      resolve: (parent) => parent.platform,
    }),
    tenants: t.field({
      type: [TenantRelationObject],
      resolve: (parent) => parent.tenants,
    }),
    organizations: t.field({
      type: [OrganizationRelationObject],
      resolve: (parent) => parent.organizations,
    }),
  }),
});
