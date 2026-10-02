import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { ITagService } from "@/features/tags/services";
import { CreateTagInput } from "../inputs/CreateTagInput";
import { TagObject } from "../objects/TagObject";

builder.mutationFields((t) => ({
  createTag: t.field({
    type: TagObject,
    args: {
      input: t.arg({ type: CreateTagInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      const service = container.get<ITagService>(TYPES.TagService);
      return service.create({
        workspaceId: input.workspaceId,
        spaceId: input.spaceId,
        name: input.name,
        color: input.color ?? undefined,
        description: input.description,
      });
    },
  }),
}));
