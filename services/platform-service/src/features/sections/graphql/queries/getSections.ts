import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { SectionObject } from "@/features/sections/graphql/objects/SectionObject";
import type { ISectionService } from "@/features/sections/services";

builder.queryFields((t) => ({
  getSections: t.field({
    type: [SectionObject],
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { organizationId }, ctx) => {
      const service = container.get<ISectionService>(TYPES.SectionService);
      return service.listSections(organizationId, requireIdentityId(ctx));
    },
  }),
}));
