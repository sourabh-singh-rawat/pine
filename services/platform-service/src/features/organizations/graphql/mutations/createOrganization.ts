import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { CreateOrganizationInput } from "@/features/organizations/graphql/inputs/CreateOrganizationInput";
import { OrganizationObject } from "@/features/organizations/graphql/objects/OrganizationObject";
import type { IOrganizationService } from "@/features/organizations/services";

builder.mutationFields((t) => ({
  createOrganization: t.field({
    type: OrganizationObject,
    args: {
      input: t.arg({ type: CreateOrganizationInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IOrganizationService>(TYPES.OrganizationService);

      return service.create(
        {
          tenantId: input.tenantId,
          parentOrganizationId: input.parentOrganizationId ?? undefined,
          name: input.name,
          slug: input.slug,
          description: input.description ?? undefined,
          isActive: input.isActive ?? undefined,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
