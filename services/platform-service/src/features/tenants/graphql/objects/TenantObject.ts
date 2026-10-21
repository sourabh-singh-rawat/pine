import { builder } from "@pine/server";
import type { Tenant } from "@/db";

export const TenantObject = builder.objectRef<Tenant>("TenantObject");

TenantObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    description: t.exposeString("description", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    suspendedAt: t.expose("suspendedAt", { type: "DateTimeISO", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
