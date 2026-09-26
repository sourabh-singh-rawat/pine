import { builder } from "@pine/server";
import type { ItemStatusGroup } from "@/features/item/services/IItemService";
import { StatusObject } from "@/features/item-statuses/graphql/objects/StatusObject";
import { ItemGroupPageInfoObject } from "./ItemGroupPageInfoObject";
import { ItemObject } from "./ItemObject";

export type ItemStatusGroupObjectShape = ItemStatusGroup;

export const ItemStatusGroupObject = builder
  .objectRef<ItemStatusGroupObjectShape>("ItemStatusGroupObject")
  .implement({
    fields: (t) => ({
      status: t.field({
        type: StatusObject,
        resolve: (parent) => parent.status,
      }),
      items: t.field({
        type: [ItemObject],
        resolve: (parent) => parent.items,
      }),
      pageInfo: t.field({
        type: ItemGroupPageInfoObject,
        resolve: (parent) => parent.pageInfo,
      }),
      totalCount: t.exposeInt("totalCount"),
    }),
  });
