import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemService } from "@/features/item";
import { ItemObject } from "../objects/ItemObject";

builder.queryFields((t) => ({
  getItem: t.field({
    type: ItemObject,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const userId = requireIdentityId(ctx);
      const service = container.get<IItemService>(TYPES.ItemService);
      return await service.getById({ userId, itemId: id });
    },
  }),
}));
