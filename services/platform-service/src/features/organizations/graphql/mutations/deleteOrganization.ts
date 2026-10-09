import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import type { IOrganizationService } from "@/features/organizations/services";

builder.mutationFields((t) => ({
  deleteOrganization: t.string({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<IOrganizationService>(TYPES.OrganizationService);
      await service.delete(id, requireIdentityId(ctx));
      return id;
    },
  }),
}));
