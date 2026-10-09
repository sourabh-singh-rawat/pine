import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { AuditLogObject } from "@/features/audit/graphql/objects/AuditLogObject";
import type { IAuditLogService } from "@/features/audit/services";

builder.queryFields((t) => ({
  getItemAuditLogs: t.field({
    type: [AuditLogObject],
    args: {
      itemId: t.arg.string({ required: true }),
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { itemId, organizationId }, ctx) => {
      const service = container.get<IAuditLogService>(TYPES.AuditLogService);
      return service.list(
        {
          entityType: "item",
          entityId: itemId,
          organizationId,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
