import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { CreateOrganizationRelationInput } from "@/features/organizations/graphql/inputs/CreateOrganizationRelationInput";
import { OrganizationRelationObject } from "@/features/organizations/graphql/objects/OrganizationRelationObject";
import type { IOrganizationRelationService } from "@/features/organizations/services";

builder.mutationFields((t) => ({
  createOrganizationRelation: t.field({
    type: OrganizationRelationObject,
    args: {
      input: t.arg({ type: CreateOrganizationRelationInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IOrganizationRelationService>(
        TYPES.OrganizationRelationService,
      );

      return service.create(
        {
          organizationId: input.organizationId,
          relation: input.relation,
          identityId: input.identityId,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
