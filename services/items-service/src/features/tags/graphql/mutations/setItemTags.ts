import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { ITagService } from "@/features/tags/services";
import { SetItemTagsInput } from "../inputs/SetItemTagsInput";
import { TagObject } from "../objects/TagObject";

builder.mutationFields((t) => ({
  setItemTags: t.field({
    type: [TagObject],
    args: {
      input: t.arg({ type: SetItemTagsInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      const service = container.get<ITagService>(TYPES.TagService);
      return service.setItemTags(input.itemId, input.tagIds);
    },
  }),
}));
