import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationPreferenceObject } from "@/features/organizations/graphql/objects/OrganizationPreferenceObject";
import type { IOrganizationPreferenceService } from "@/features/organizations/services";

builder.queryFields((t) => ({
  getMyOrganizationPreference: t.field({
    type: OrganizationPreferenceObject,
    nullable: true,
    authScopes: {
      identityRequired: true,
    },
    resolve: async (_root, _args, ctx) => {
      const service = container.get<IOrganizationPreferenceService>(
        TYPES.OrganizationPreferenceService,
      );
      return service.get(requireIdentityId(ctx));
    },
  }),
}));
