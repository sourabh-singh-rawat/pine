import { builder } from "@pine/server";

import "@/features/lists/graphql";
import "@/features/item/graphql";
import "@/features/sub-items/graphql";
import "@/features/attachments/graphql";
import "@/features/checklists/graphql";
import "@/features/spaces/graphql";
import "@/features/item-statuses/graphql";

export const schema = builder.toSchema({});
