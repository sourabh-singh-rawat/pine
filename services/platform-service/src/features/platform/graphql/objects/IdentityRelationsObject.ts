import { builder } from "@pine/server";
import { IdentityOrganizationRelationObject } from "@/features/platform/graphql/objects/IdentityOrganizationRelationObject";
import { IdentityTenantRelationObject } from "@/features/platform/graphql/objects/IdentityTenantRelationObject";
import { PlatformRelationObject } from "@/features/platform/graphql/objects/PlatformRelationObject";
import type { IdentityRelations } from "@/features/platform/services/IIdentityRelationService";

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
      type: [IdentityTenantRelationObject],
      resolve: (parent) => parent.tenants,
    }),
    organizations: t.field({
      type: [IdentityOrganizationRelationObject],
      resolve: (parent) => parent.organizations,
    }),
  }),
});
