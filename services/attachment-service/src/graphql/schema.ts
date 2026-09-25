import { builder } from "@pine/server";

import "@/graphql/queries/helloQuery";
import "@/features/attachment/graphql";

export const schema = builder.toSchema({});
