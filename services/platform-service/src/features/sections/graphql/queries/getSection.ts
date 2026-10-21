import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { SectionObject } from "@/features/sections/graphql/objects/SectionObject";
import type { ISectionService } from "@/features/sections/services";

builder.queryFields((t) => ({
  getSection: t.field({
    type: SectionObject,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<ISectionService>(TYPES.SectionService);
      return service.getSectionById(id, requireIdentityId(ctx));
    },
  }),
}));
