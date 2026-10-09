import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationObject } from "@/features/organizations/graphql/objects/OrganizationObject";
import type { IOrganizationService } from "@/features/organizations/services";

builder.queryFields((t) => ({
  getOrganizations: t.field({
    type: [OrganizationObject],
    args: {
      tenantId: t.arg.string({ required: true }),
      parentOrganizationId: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const service = container.get<IOrganizationService>(TYPES.OrganizationService);

      return service.list(
        {
          tenantId: args.tenantId,
          parentOrganizationId: args.parentOrganizationId ?? undefined,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
