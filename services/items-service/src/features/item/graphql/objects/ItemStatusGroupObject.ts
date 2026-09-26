import { builder } from "@pine/server";
import type { StatusOption } from "@/db";
import type { ItemListItem } from "@/features/item/services/IItemService";
import { StatusObject } from "@/features/item-statuses/graphql/objects/StatusObject";
import { ItemObject } from "./ItemObject";

export type ItemStatusGroupObjectShape = {
  status: StatusOption;
  items: ItemListItem[];
};

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
    }),
  });
