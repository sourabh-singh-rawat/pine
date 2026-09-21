import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { SpaceObject } from "@/features/spaces/graphql/objects/SpaceObject";
import type { ISpaceService } from "@/features/spaces/services";

builder.queryFields((t) => ({
  getSpaces: t.field({
    type: [SpaceObject],
    args: {
      workspaceId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const service = container.get<ISpaceService>(TYPES.SpaceService);
      return service.list(
        { workspaceId: args.workspaceId },
        requireIdentityId(ctx),
      );
    },
  }),
}));
