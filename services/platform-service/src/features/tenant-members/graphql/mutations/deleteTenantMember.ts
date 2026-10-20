import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import type { ITenantMemberService } from "@/features/tenant-members/services";

builder.mutationFields((t) => ({
  deleteTenantMember: t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<ITenantMemberService>(TYPES.TenantMemberService);
      await service.deleteTenantMember(id, requireIdentityId(ctx));
      return true;
    },
  }),
}));
