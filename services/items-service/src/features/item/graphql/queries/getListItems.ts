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
      first: t.arg.int(),
      statusId: t.arg.string(),
      after: t.arg.string(),
    },
    resolve: async (_root, { listId, first, statusId, after }, ctx) => {
      const service = container.get<IItemService>(TYPES.ItemService);
      const userId = requireIdentityId(ctx);
      return await service.list({ userId, listId, first, statusId, after });
    },
  }),
}));
