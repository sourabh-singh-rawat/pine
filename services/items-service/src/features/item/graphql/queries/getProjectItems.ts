import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemService } from "@/features/item";
import { ItemObject } from "../objects/ItemObject";

builder.queryFields((t) => ({
  getProjectItems: t.field({
    type: [ItemObject],
    args: {
      projectId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { projectId }, ctx) => {
      const userId = requireIdentityId(ctx);
      const service = container.get<IItemService>(TYPES.ItemService);
      return await service.list({ userId, projectId });
    },
  }),
}));
