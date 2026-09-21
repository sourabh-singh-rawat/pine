import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { CreateSpaceInput } from "@/features/spaces/graphql/inputs/CreateSpaceInput";
import { SpaceObject } from "@/features/spaces/graphql/objects/SpaceObject";
import type { ISpaceService } from "@/features/spaces/services";

builder.mutationFields((t) => ({
  createSpace: t.field({
    type: SpaceObject,
    args: {
      input: t.arg({ type: CreateSpaceInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<ISpaceService>(TYPES.SpaceService);

      return service.create(
        {
          workspaceId: input.workspaceId,
          name: input.name,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
