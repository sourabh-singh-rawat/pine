import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationRelationObject } from "@/features/organizations/graphql/objects/OrganizationRelationObject";
import type { IOrganizationRelationService } from "@/features/organizations/services";

builder.queryFields((t) => ({
  getOrganizationRelation: t.field({
    type: OrganizationRelationObject,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const service = container.get<IOrganizationRelationService>(
        TYPES.OrganizationRelationService,
      );
      return service.getById(args.id, requireIdentityId(ctx));
    },
  }),
}));
