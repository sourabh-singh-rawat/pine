import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { ITagService } from "@/features/tags/services";
import { UpdateTagInput } from "../inputs/UpdateTagInput";
import { TagObject } from "../objects/TagObject";

builder.mutationFields((t) => ({
  updateTag: t.field({
    type: TagObject,
    args: {
      input: t.arg({ type: UpdateTagInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      const service = container.get<ITagService>(TYPES.TagService);
      return service.update({
        id: input.id,
        name: input.name ?? undefined,
        color: input.color ?? undefined,
        description: input.description,
      });
    },
  }),
}));
