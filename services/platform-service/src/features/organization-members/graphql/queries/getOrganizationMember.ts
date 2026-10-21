import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OrganizationMemberObject } from "@/features/organization-members/graphql/objects/OrganizationMemberObject";
import type { IOrganizationMemberService } from "@/features/organization-members/services";

builder.queryFields((t) => ({
  getOrganizationMember: t.field({
    type: OrganizationMemberObject,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<IOrganizationMemberService>(TYPES.OrganizationMemberService);
      return service.getOrganizationMemberById(id, requireIdentityId(ctx));
    },
  }),
}));
