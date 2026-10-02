import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { ITagService } from "@/features/tags/services";

builder.mutationFields((t) => ({
  deleteTag: t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }) => {
      const service = container.get<ITagService>(TYPES.TagService);
      return service.delete(id);
    },
  }),
}));
