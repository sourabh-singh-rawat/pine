import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IItemService } from "@/features/item/services";
import { ReorderListItemsInput } from "../inputs/ReorderListItemsInput";
import { ItemObject } from "../objects/ItemObject";

builder.mutationFields((t) => ({
  reorderListItems: t.field({
    type: [ItemObject],
    args: {
      input: t.arg({ type: ReorderListItemsInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IItemService>(TYPES.ItemService);
      return service.reorder({
        listId: String(input.listId),
        statusId: String(input.statusId),
        itemIds: input.itemIds.map((itemId) => String(itemId)),
        identityId: requireIdentityId(ctx),
      });
    },
  }),
}));
