import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { CreateOrganizationMemberInput } from "@/features/organization-members/graphql/inputs/CreateOrganizationMemberInput";
import { OrganizationMemberObject } from "@/features/organization-members/graphql/objects/OrganizationMemberObject";
import type { IOrganizationMemberService } from "@/features/organization-members/services";

builder.mutationFields((t) => ({
  createOrganizationMember: t.field({
    type: OrganizationMemberObject,
    args: {
      input: t.arg({ type: CreateOrganizationMemberInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IOrganizationMemberService>(TYPES.OrganizationMemberService);

      return service.createOrganizationMember(
        {
          organizationId: input.organizationId,
          identityId: input.identityId,
          role: input.role,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
