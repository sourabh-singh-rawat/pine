import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import type { IOrganizationMemberService } from "@/features/organization-members/services";

builder.mutationFields((t) => ({
  deleteOrganizationMember: t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<IOrganizationMemberService>(TYPES.OrganizationMemberService);
      await service.deleteOrganizationMember(id, requireIdentityId(ctx));
      return true;
    },
  }),
}));
