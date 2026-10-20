import { builder } from "@pine/server";
import type { OrganizationType } from "@/db";

export const OrganizationTypeObject = builder.objectRef<OrganizationType>("OrganizationTypeObject");

OrganizationTypeObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    tenantId: t.exposeString("tenantId"),
    parentOrganizationTypeId: t.exposeString("parentOrganizationTypeId", { nullable: true }),
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    description: t.exposeString("description", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
