import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { CreateOrganizationTypeInput } from "@/features/organization-types/graphql/inputs/CreateOrganizationTypeInput";
import { OrganizationTypeObject } from "@/features/organization-types/graphql/objects/OrganizationTypeObject";
import type { IOrganizationTypeService } from "@/features/organization-types/services";

builder.mutationFields((t) => ({
  createOrganizationType: t.field({
    type: OrganizationTypeObject,
    args: {
      input: t.arg({ type: CreateOrganizationTypeInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IOrganizationTypeService>(TYPES.OrganizationTypeService);

      return service.create(
        {
          tenantId: input.tenantId,
          parentOrganizationTypeId: input.parentOrganizationTypeId ?? undefined,
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
