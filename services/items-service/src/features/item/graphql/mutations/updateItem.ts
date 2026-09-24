import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemService } from "@/features/item";
import { UpdateItemInput } from "../inputs/UpdateItemInput";
import { parseItemPriority } from "../parseItemPriority";

builder.mutationFields((t) => ({
  updateItem: t.string({
    args: {
      input: t.arg({ type: UpdateItemInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const userId = requireIdentityId(ctx);
      const service = container.get<IItemService>(TYPES.ItemService);
      const { itemId } = input;

      await service.update({
        userId,
        itemId,
        name: input.name ?? undefined,
        type: input.type ?? undefined,
        statusId: input.statusId ?? undefined,
        priority: input.priority == null ? undefined : parseItemPriority(input.priority),
        dueDate: input.dueDate === undefined ? undefined : input.dueDate,
        description: input.description ?? undefined,
        estimate: input.estimate ?? undefined,
        component: input.component ?? undefined,
      });

      return "Updated successfully";
    },
  }),
}));
