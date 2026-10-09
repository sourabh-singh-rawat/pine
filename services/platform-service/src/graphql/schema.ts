import { builder } from "@pine/server";

import "@/features/identities/graphql";
import "@/features/tenants/graphql";
import "@/features/organizations/graphql";
import "@/features/platform/graphql";

export const schema = builder.toSchema({});
