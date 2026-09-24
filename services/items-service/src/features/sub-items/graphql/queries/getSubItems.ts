import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { ItemObject } from "@/features/item/graphql/objects/ItemObject";
import { ISubItemService } from "@/features/sub-items";
import { GetSubItemsInput } from "../inputs/GetSubItemsInput";

builder.queryFields((t) => ({
  getSubItems: t.field({
    type: [ItemObject],
    args: {
      input: t.arg({ type: GetSubItemsInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const { parentItemId } = input;
      const userId = requireIdentityId(ctx);
      const service = container.get<ISubItemService>(TYPES.SubItemService);
      return service.list({ userId, parentItemId });
    },
  }),
}));
