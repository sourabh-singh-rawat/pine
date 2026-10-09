import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationRelationObject } from "@/features/organizations/graphql/objects/OrganizationRelationObject";
import type { IOrganizationRelationService } from "@/features/organizations/services";

builder.queryFields((t) => ({
  getOrganizationRelations: t.field({
    type: [OrganizationRelationObject],
    args: {
      organizationId: t.arg.string({ required: true }),
      relation: t.arg.string({ required: false }),
      identityId: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const service = container.get<IOrganizationRelationService>(
        TYPES.OrganizationRelationService,
      );
      return service.list(
        {
          organizationId: args.organizationId,
          relation: args.relation ?? undefined,
          identityId: args.identityId ?? undefined,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
