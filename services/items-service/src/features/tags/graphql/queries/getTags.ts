import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { ITagService } from "@/features/tags/services";
import { GetTagsInput } from "../inputs/GetTagsInput";
import { TagObject } from "../objects/TagObject";

builder.queryFields((t) => ({
  getTags: t.field({
    type: [TagObject],
    args: {
      input: t.arg({ type: GetTagsInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      const service = container.get<ITagService>(TYPES.TagService);
      return service.list({
        workspaceId: input.workspaceId,
        spaceId: input.spaceId,
      });
    },
  }),
}));
