import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { SpaceObject } from "@/features/spaces/graphql/objects/SpaceObject";
import type { ISpaceService } from "@/features/spaces/services";

builder.queryFields((t) => ({
  getSpace: t.field({
    type: SpaceObject,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const service = container.get<ISpaceService>(TYPES.SpaceService);
      return service.getById(args.id, requireIdentityId(ctx));
    },
  }),
}));
