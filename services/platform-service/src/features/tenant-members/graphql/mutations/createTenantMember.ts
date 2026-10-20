import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { CreateTenantMemberInput } from "@/features/tenant-members/graphql/inputs/CreateTenantMemberInput";
import { TenantMemberObject } from "@/features/tenant-members/graphql/objects/TenantMemberObject";
import type { ITenantMemberService } from "@/features/tenant-members/services";

builder.mutationFields((t) => ({
  createTenantMember: t.field({
    type: TenantMemberObject,
    args: {
      input: t.arg({ type: CreateTenantMemberInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<ITenantMemberService>(TYPES.TenantMemberService);

      return service.createTenantMember(
        {
          tenantId: input.tenantId,
          identityId: input.identityId,
          role: input.role,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
