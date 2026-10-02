import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { ITagService } from "@/features/tags/services";
import { TagObject } from "../objects/TagObject";

builder.queryFields((t) => ({
  getItemTags: t.field({
    type: [TagObject],
    args: {
      itemId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { itemId }) => {
      const service = container.get<ITagService>(TYPES.TagService);
      return service.getItemTags(itemId);
    },
  }),
}));
