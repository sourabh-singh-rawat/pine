import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationTypeObject } from "@/features/organization-types/graphql/objects/OrganizationTypeObject";
import type { IOrganizationTypeService } from "@/features/organization-types/services";

builder.queryFields((t) => ({
  getOrganizationTypes: t.field({
    type: [OrganizationTypeObject],
    args: {
      tenantId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { tenantId }, ctx) => {
      const service = container.get<IOrganizationTypeService>(TYPES.OrganizationTypeService);
      return service.list(tenantId, requireIdentityId(ctx));
    },
  }),
}));
