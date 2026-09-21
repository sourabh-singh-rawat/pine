import { builder } from "@pine/server";
import type { AuditLog } from "@/db";

export const AuditLogObject = builder.objectRef<AuditLog>("AuditLogObject");

AuditLogObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    entityType: t.exposeString("entityType"),
    entityId: t.exposeString("entityId"),
    action: t.exposeString("action"),
    actorId: t.exposeString("actorId", { nullable: true }),
    workspaceId: t.exposeString("workspaceId", { nullable: true }),
    tenantId: t.exposeString("tenantId", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
