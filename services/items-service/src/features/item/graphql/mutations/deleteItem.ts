import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemService } from "@/features/item";

builder.mutationFields((t) => ({
  deleteItem: t.string({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const userId = requireIdentityId(ctx);
      const service = container.get<IItemService>(TYPES.ItemService);
      await service.delete({ id, userId });
      return "Deleted successfully";
    },
  }),
}));
