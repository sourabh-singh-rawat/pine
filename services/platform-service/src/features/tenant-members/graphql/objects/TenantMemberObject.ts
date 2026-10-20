import { builder } from "@pine/server";
import type { TenantMember } from "@/db";

export const TenantMemberObject = builder.objectRef<TenantMember>("TenantMemberObject");

TenantMemberObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    tenantId: t.exposeString("tenantId"),
    identityId: t.exposeString("identityId"),
    role: t.exposeString("role"),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
