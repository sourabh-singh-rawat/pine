import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import type { ISpaceService } from "@/features/spaces/services";
import { UpdateSpaceInput } from "../inputs/UpdateSpaceInput";

builder.mutationFields((t) => ({
  updateSpace: t.string({
    args: {
      input: t.arg({ type: UpdateSpaceInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<ISpaceService>(TYPES.SpaceService);
      await service.update({
        id: input.id,
        name: input.name,
        identityId: requireIdentityId(ctx),
      });
      return "Updated successfully";
    },
  }),
}));
