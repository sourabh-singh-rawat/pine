import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { OfficeTypeObject } from "@/features/office-types/graphql/objects/OfficeTypeObject";
import type { IOfficeTypeService } from "@/features/office-types/services";

builder.queryFields((t) => ({
  getOfficeTypes: t.field({
    type: [OfficeTypeObject],
    args: {
      tenantId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { tenantId }, ctx) => {
      const service = container.get<IOfficeTypeService>(TYPES.OfficeTypeService);
      return service.list(tenantId, requireIdentityId(ctx));
    },
  }),
}));
