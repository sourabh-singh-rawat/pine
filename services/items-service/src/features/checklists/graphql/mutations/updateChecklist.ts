import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IChecklistService } from "@/features/checklists/services";
import { UpdateChecklistInput } from "../inputs/UpdateChecklistInput";
import { ChecklistObject, toChecklistObjectShape } from "../objects/ChecklistObject";

builder.mutationFields((t) => ({
  updateChecklist: t.field({
    type: ChecklistObject,
    args: {
      input: t.arg({ type: UpdateChecklistInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IChecklistService>(TYPES.ChecklistService);
      const row = await service.update({
        id: input.id,
        name: input.name,
        identityId,
      });
      return toChecklistObjectShape(row);
    },
  }),
}));
