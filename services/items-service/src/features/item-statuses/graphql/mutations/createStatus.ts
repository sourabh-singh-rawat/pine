import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IStatusService } from "@/features/item-statuses";
import { CreateStatusInput } from "../inputs/CreateStatusInput";
import { StatusObject } from "../objects/StatusObject";

builder.mutationFields((t) => ({
  createStatus: t.field({
    type: StatusObject,
    args: {
      input: t.arg({ type: CreateStatusInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IStatusService>(TYPES.StatusService);
      return service.create({
        listId: String(input.listId),
        name: input.name,
        type: input.type,
        color: input.color,
        identityId: requireIdentityId(ctx),
      });
    },
  }),
}));
