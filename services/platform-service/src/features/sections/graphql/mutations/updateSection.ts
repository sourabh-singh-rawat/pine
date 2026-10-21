import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { UpdateSectionInput } from "@/features/sections/graphql/inputs/UpdateSectionInput";
import { SectionObject } from "@/features/sections/graphql/objects/SectionObject";
import type { ISectionService } from "@/features/sections/services";

builder.mutationFields((t) => ({
  updateSection: t.field({
    type: SectionObject,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateSectionInput, required: true }),
    },
    resolve: async (_root, { id, input }, ctx) => {
      const service = container.get<ISectionService>(TYPES.SectionService);

      return service.updateSection(
        id,
        {
          name: input.name ?? undefined,
          slug: input.slug ?? undefined,
          description: input.description ?? undefined,
          isActive: input.isActive ?? undefined,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
