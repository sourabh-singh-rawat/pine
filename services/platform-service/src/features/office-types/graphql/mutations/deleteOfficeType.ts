import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import type { IOfficeTypeService } from "@/features/office-types/services";

builder.mutationFields((t) => ({
  deleteOfficeType: t.string({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<IOfficeTypeService>(TYPES.OfficeTypeService);
      await service.delete(id, requireIdentityId(ctx));
      return id;
    },
  }),
}));
