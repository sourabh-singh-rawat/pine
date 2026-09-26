import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IStatusService } from "@/features/item-statuses";
import { FindStatusesOptions } from "../inputs/FindStatusesOptions";
import { StatusObject } from "../objects/StatusObject";

builder.queryFields((t) => ({
  findStatuses: t.field({
    type: [StatusObject],
    args: {
      input: t.arg({ type: FindStatusesOptions, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IStatusService>(TYPES.StatusService);
      return await service.list({
        listId: input.listId,
        identityId: requireIdentityId(ctx),
      });
    },
  }),
}));
