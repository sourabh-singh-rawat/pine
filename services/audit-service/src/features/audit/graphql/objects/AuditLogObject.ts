import { builder } from "@pine/server";
import type { AuditLogWithActor } from "@/features/audit/services";
import { AuditIdentityObject } from "@/features/identities/graphql/objects/AuditIdentityObject";

export const AuditLogObject = builder.objectRef<AuditLogWithActor>("AuditLogObject");

AuditLogObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    entityType: t.exposeString("entityType"),
    entityId: t.exposeString("entityId"),
    action: t.exposeString("action"),
    actorId: t.exposeString("actorId", { nullable: true }),
    actor: t.field({
      type: AuditIdentityObject,
      nullable: true,
      resolve: (log) => log.actor,
    }),
    workspaceId: t.exposeString("workspaceId", { nullable: true }),
    tenantId: t.exposeString("tenantId", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
