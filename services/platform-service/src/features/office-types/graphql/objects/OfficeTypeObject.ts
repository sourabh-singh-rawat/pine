import { builder } from "@pine/server";
import type { OrganizationOfficeType } from "@/db";

export const OfficeTypeObject = builder.objectRef<OrganizationOfficeType>("OfficeTypeObject");

OfficeTypeObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    tenantId: t.exposeString("tenantId"),
    parentOfficeTypeId: t.exposeString("parentOfficeTypeId", { nullable: true }),
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    description: t.exposeString("description", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
