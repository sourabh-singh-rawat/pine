import { builder } from "@pine/server";

import "@/features/identities/graphql";
import "@/features/tenants/graphql";
import "@/features/tenant-members/graphql";
import "@/features/organizations/graphql";
import "@/features/organization-types/graphql";
import "@/features/platform/graphql";

export const schema = builder.toSchema({});
