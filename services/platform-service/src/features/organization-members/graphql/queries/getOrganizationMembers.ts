import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationMemberObject } from "@/features/organization-members/graphql/objects/OrganizationMemberObject";
import type { IOrganizationMemberService } from "@/features/organization-members/services";

builder.queryFields((t) => ({
  getOrganizationMembers: t.field({
    type: [OrganizationMemberObject],
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { organizationId }, ctx) => {
      const service = container.get<IOrganizationMemberService>(TYPES.OrganizationMemberService);
      return service.listOrganizationMembers(organizationId, requireIdentityId(ctx));
    },
  }),
}));
