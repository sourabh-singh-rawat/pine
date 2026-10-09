import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationPreferenceObject } from "@/features/organizations/graphql/objects/OrganizationPreferenceObject";
import type { IOrganizationPreferenceService } from "@/features/organizations/services";

builder.mutationFields((t) => ({
  setMyOrganizationPreference: t.field({
    type: OrganizationPreferenceObject,
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    authScopes: {
      identityRequired: true,
    },
    resolve: async (_root, { organizationId }, ctx) => {
      const service = container.get<IOrganizationPreferenceService>(
        TYPES.OrganizationPreferenceService,
      );
      return service.set(organizationId, requireIdentityId(ctx));
    },
  }),
}));
