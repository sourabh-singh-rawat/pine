import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemService } from "@/features/item";
import { CreateItemInput } from "../inputs/CreateItemInput";
import { parseItemPriority } from "../parseItemPriority";

builder.mutationFields((t) => ({
  createItem: t.string({
    args: {
      input: t.arg({ type: CreateItemInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const userId = requireIdentityId(ctx);
      const service = container.get<IItemService>(TYPES.ItemService);

      return service.create({
        userId,
        name: input.name,
        type: input.type,
        listId: input.listId,
        parentItemId: input.parentItemId ?? undefined,
        statusId: String(input.statusId),
        priority: parseItemPriority(input.priority),
        dueDate: input.dueDate ?? undefined,
        description: input.description ?? undefined,
        assigneeIds: input.assigneeIds,
        estimate: input.estimate ?? undefined,
        component: input.component ?? undefined,
      });
    },
  }),
}));
