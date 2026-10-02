import { builder } from "@pine/server";

import "@/graphql/queries/helloQuery";
import "@/graphql/mutations/helloMutation";
import "@/features/admin/graphql";
import "@/features/profiles/graphql";

export const schema = builder.toSchema({});
