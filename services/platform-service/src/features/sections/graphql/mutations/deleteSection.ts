import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import type { ISectionService } from "@/features/sections/services";

builder.mutationFields((t) => ({
  deleteSection: t.string({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<ISectionService>(TYPES.SectionService);
      await service.deleteSection(id, requireIdentityId(ctx));
      return id;
    },
  }),
}));
