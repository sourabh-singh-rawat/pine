import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IListService } from "@/features/lists";
import { UpdateListInput } from "../inputs/UpdateListInput";

builder.mutationFields((t) => ({
  updateList: t.string({
    args: {
      input: t.arg({ type: UpdateListInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IListService>(TYPES.ListService);
      const userId = requireIdentityId(ctx);
      await service.update({ userId, id: input.id, name: input.name });
      return "Updated successfully";
    },
  }),
}));
