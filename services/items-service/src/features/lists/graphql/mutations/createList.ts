import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IListService } from "@/features/lists";
import { CreateListInput } from "../inputs/CreateListInput";

builder.mutationFields((t) => ({
  createList: t.string({
    args: {
      input: t.arg({ type: CreateListInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IListService>(TYPES.ListService);
      const userId = requireIdentityId(ctx);
      return service.create({ userId, ...input });
    },
  }),
}));
