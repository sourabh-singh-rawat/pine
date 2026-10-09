import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OfficeTypeObject } from "@/features/office-types/graphql/objects/OfficeTypeObject";
import type { IOfficeTypeService } from "@/features/office-types/services";

builder.queryFields((t) => ({
  getOfficeType: t.field({
    type: OfficeTypeObject,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<IOfficeTypeService>(TYPES.OfficeTypeService);
      return service.getById(id, requireIdentityId(ctx));
    },
  }),
}));
