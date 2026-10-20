import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { UpdateTenantMemberRoleInput } from "@/features/tenant-members/graphql/inputs/UpdateTenantMemberRoleInput";
import { TenantMemberObject } from "@/features/tenant-members/graphql/objects/TenantMemberObject";
import type { ITenantMemberService } from "@/features/tenant-members/services";

builder.mutationFields((t) => ({
  updateTenantMemberRole: t.field({
    type: TenantMemberObject,
    args: {
      input: t.arg({ type: UpdateTenantMemberRoleInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<ITenantMemberService>(TYPES.TenantMemberService);

      return service.updateTenantMemberRole(input.id, input.role, requireIdentityId(ctx));
    },
  }),
}));
