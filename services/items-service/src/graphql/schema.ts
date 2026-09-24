import { builder } from "@pine/server";

import "@/features/project/graphql";
import "@/features/item/graphql";
import "@/features/attachments/graphql";
import "@/features/checklists/graphql";
import "@/features/spaces/graphql";
import "@/features/status/graphql";

export const schema = builder.toSchema({});
