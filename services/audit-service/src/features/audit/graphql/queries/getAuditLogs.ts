import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { AuditLogObject } from "@/features/audit/graphql/objects/AuditLogObject";
import type { IAuditLogService } from "@/features/audit/services";

builder.queryFields((t) => ({
  getAuditLogs: t.field({
    type: [AuditLogObject],
    args: {
      entityType: t.arg.string({ required: true }),
      entityId: t.arg.string({ required: true }),
      workspaceId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { entityType, entityId, workspaceId }, ctx) => {
      const service = container.get<IAuditLogService>(TYPES.AuditLogService);
      return service.list(
        {
          entityType,
          entityId,
          workspaceId,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
