import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemService } from "@/features/item";
import { GetSubItemsInput } from "../inputs/GetSubItemsInput";
import { ItemObject } from "../objects/ItemObject";

builder.queryFields((t) => ({
  getSubItems: t.field({
    type: [ItemObject],
    args: {
      input: t.arg({ type: GetSubItemsInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const { parentItemId } = input;
      const userId = requireIdentityId(ctx);
      const service = container.get<IItemService>(TYPES.ItemService);
      return await service.listChildren({ userId, parentItemId });
    },
  }),
}));
