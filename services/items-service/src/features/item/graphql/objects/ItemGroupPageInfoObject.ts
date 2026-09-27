import { builder } from "@pine/server";
import type { ItemGroupPageInfo } from "@/features/item/services/IItemService";

export const ItemGroupPageInfoObject = builder
  .objectRef<ItemGroupPageInfo>("ItemGroupPageInfo")
  .implement({
    fields: (t) => ({
      hasNextPage: t.exposeBoolean("hasNextPage"),
      endCursor: t.exposeString("endCursor", { nullable: true }),
    }),
  });
