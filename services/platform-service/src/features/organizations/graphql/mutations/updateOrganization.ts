import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { UpdateOrganizationInput } from "@/features/organizations/graphql/inputs/UpdateOrganizationInput";
import { OrganizationObject } from "@/features/organizations/graphql/objects/OrganizationObject";
import type { IOrganizationService } from "@/features/organizations/services";

builder.mutationFields((t) => ({
  updateOrganization: t.field({
    type: OrganizationObject,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateOrganizationInput, required: true }),
    },
    resolve: async (_root, { id, input }, ctx) => {
      const service = container.get<IOrganizationService>(TYPES.OrganizationService);

      return service.update(
        id,
        {
          parentOrganizationId: input.parentOrganizationId,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
