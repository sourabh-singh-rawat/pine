import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { CreateSectionInput } from "@/features/sections/graphql/inputs/CreateSectionInput";
import { SectionObject } from "@/features/sections/graphql/objects/SectionObject";
import type { ISectionService } from "@/features/sections/services";

builder.mutationFields((t) => ({
  createSection: t.field({
    type: SectionObject,
    args: {
      input: t.arg({ type: CreateSectionInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<ISectionService>(TYPES.SectionService);

      return service.createSection(
        {
          tenantId: input.tenantId,
          organizationId: input.organizationId,
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
