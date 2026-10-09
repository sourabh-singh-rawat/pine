import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import type { IOrganizationRelationService } from "@/features/organizations/services";

builder.mutationFields((t) => ({
  deleteOrganizationRelation: t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const service = container.get<IOrganizationRelationService>(
        TYPES.OrganizationRelationService,
      );
      await service.delete(args.id, requireIdentityId(ctx));
      return true;
    },
  }),
}));
