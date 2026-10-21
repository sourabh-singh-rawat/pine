import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { UpdateOrganizationMemberRoleInput } from "@/features/organization-members/graphql/inputs/UpdateOrganizationMemberRoleInput";
import { OrganizationMemberObject } from "@/features/organization-members/graphql/objects/OrganizationMemberObject";
import type { IOrganizationMemberService } from "@/features/organization-members/services";

builder.mutationFields((t) => ({
  updateOrganizationMemberRole: t.field({
    type: OrganizationMemberObject,
    args: {
      input: t.arg({ type: UpdateOrganizationMemberRoleInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IOrganizationMemberService>(TYPES.OrganizationMemberService);

      return service.updateOrganizationMemberRole(input.id, input.role, requireIdentityId(ctx));
    },
  }),
}));
