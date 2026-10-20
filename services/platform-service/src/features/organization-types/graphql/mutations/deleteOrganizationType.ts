import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import type { IOrganizationTypeService } from "@/features/organization-types/services";

builder.mutationFields((t) => ({
  deleteOrganizationType: t.string({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<IOrganizationTypeService>(TYPES.OrganizationTypeService);
      await service.delete(id, requireIdentityId(ctx));
      return id;
    },
  }),
}));
