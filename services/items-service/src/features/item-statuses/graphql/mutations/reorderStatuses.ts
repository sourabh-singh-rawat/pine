import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IStatusService } from "@/features/item-statuses";
import { ReorderStatusesInput } from "../inputs/ReorderStatusesInput";
import { StatusObject } from "../objects/StatusObject";

builder.mutationFields((t) => ({
  reorderStatuses: t.field({
    type: [StatusObject],
    args: {
      input: t.arg({ type: ReorderStatusesInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IStatusService>(TYPES.StatusService);
      return service.reorder({
        listId: String(input.listId),
        statusIds: input.statusIds.map((statusId) => String(statusId)),
        identityId: requireIdentityId(ctx),
      });
    },
  }),
}));
