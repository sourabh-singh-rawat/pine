import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IChecklistService } from "@/features/checklists/services";
import { UpdateChecklistEntryInput } from "../inputs/UpdateChecklistEntryInput";
import { ChecklistEntryObject } from "../objects/ChecklistEntryObject";

builder.mutationFields((t) => ({
  updateChecklistEntry: t.field({
    type: ChecklistEntryObject,
    args: {
      input: t.arg({ type: UpdateChecklistEntryInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IChecklistService>(TYPES.ChecklistService);
      return service.updateEntry({
        id: input.id,
        title: input.title,
        completed: input.completed,
        identityId,
      });
    },
  }),
}));
