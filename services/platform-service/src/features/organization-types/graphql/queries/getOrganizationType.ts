import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationTypeObject } from "@/features/organization-types/graphql/objects/OrganizationTypeObject";
import type { IOrganizationTypeService } from "@/features/organization-types/services";

builder.queryFields((t) => ({
  getOrganizationType: t.field({
    type: OrganizationTypeObject,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<IOrganizationTypeService>(TYPES.OrganizationTypeService);
      return service.getById(id, requireIdentityId(ctx));
    },
  }),
}));
