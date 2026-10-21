import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { TenantObject } from "@/features/tenants/graphql/objects/TenantObject";
import type { ITenantService } from "@/features/tenants/services";

builder.mutationFields((t) => ({
  suspendTenant: t.field({
    type: TenantObject,
    args: {
      id: t.arg.string({ required: true }),
      platformId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id, platformId }, ctx) => {
      const service = container.get<ITenantService>(TYPES.TenantService);
      return service.suspendTenant(id, platformId, requireIdentityId(ctx));
    },
  }),
}));
