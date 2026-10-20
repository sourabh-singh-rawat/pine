import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { TenantMemberObject } from "@/features/tenant-members/graphql/objects/TenantMemberObject";
import type { ITenantMemberService } from "@/features/tenant-members/services";

builder.queryFields((t) => ({
  getTenantMember: t.field({
    type: TenantMemberObject,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<ITenantMemberService>(TYPES.TenantMemberService);
      return service.getTenantMemberById(id, requireIdentityId(ctx));
    },
  }),
}));
