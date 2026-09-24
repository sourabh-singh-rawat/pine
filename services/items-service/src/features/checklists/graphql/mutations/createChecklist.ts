import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IChecklistService } from "@/features/checklists/services";
import { CreateChecklistInput } from "../inputs/CreateChecklistInput";
import {
  ChecklistObject,
  toChecklistObjectShape,
} from "../objects/ChecklistObject";

builder.mutationFields((t) => ({
  createChecklist: t.field({
    type: ChecklistObject,
    args: {
      input: t.arg({ type: CreateChecklistInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IChecklistService>(TYPES.ChecklistService);
      const row = await service.create({
        itemId: input.itemId,
        name: input.name,
        identityId,
      });
      return toChecklistObjectShape(row);
    },
  }),
}));
