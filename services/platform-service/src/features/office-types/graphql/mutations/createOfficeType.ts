import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { CreateOfficeTypeInput } from "@/features/office-types/graphql/inputs/CreateOfficeTypeInput";
import { OfficeTypeObject } from "@/features/office-types/graphql/objects/OfficeTypeObject";
import type { IOfficeTypeService } from "@/features/office-types/services";

builder.mutationFields((t) => ({
  createOfficeType: t.field({
    type: OfficeTypeObject,
    args: {
      input: t.arg({ type: CreateOfficeTypeInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IOfficeTypeService>(TYPES.OfficeTypeService);

      return service.create(
        {
          tenantId: input.tenantId,
          parentOfficeTypeId: input.parentOfficeTypeId ?? undefined,
          name: input.name,
          slug: input.slug,
          description: input.description ?? undefined,
          isActive: input.isActive ?? undefined,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
