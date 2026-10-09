import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationObject } from "@/features/organizations/graphql/objects/OrganizationObject";
import type { IOrganizationService } from "@/features/organizations/services";

builder.queryFields((t) => ({
  getMyOrganizations: t.field({
    type: [OrganizationObject],
    authScopes: {
      identityRequired: true,
    },
    resolve: async (_root, _args, ctx) => {
      const service = container.get<IOrganizationService>(TYPES.OrganizationService);
      return service.listMyOrganizations(requireIdentityId(ctx));
    },
  }),
}));
