import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemService } from "@/features/item";
import { ItemStatusGroupObject } from "../objects/ItemStatusGroupObject";

builder.queryFields((t) => ({
  getListItems: t.field({
    type: [ItemStatusGroupObject],
    args: {
      listId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { listId }, ctx) => {
      const service = container.get<IItemService>(TYPES.ItemService);
      const userId = requireIdentityId(ctx);
      return await service.list({ userId, listId });
    },
  }),
}));
