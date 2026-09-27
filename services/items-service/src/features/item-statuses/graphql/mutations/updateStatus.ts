import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IStatusService } from "@/features/item-statuses";
import { UpdateStatusInput } from "../inputs/UpdateStatusInput";
import { StatusObject } from "../objects/StatusObject";

builder.mutationFields((t) => ({
  updateStatus: t.field({
    type: StatusObject,
    args: {
      input: t.arg({ type: UpdateStatusInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IStatusService>(TYPES.StatusService);
      return service.update({
        id: String(input.id),
        name: input.name,
        type: input.type,
        color: input.color,
        identityId: requireIdentityId(ctx),
      });
    },
  }),
}));
