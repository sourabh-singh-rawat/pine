import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IChecklistService } from "@/features/checklists/services";
import { ReorderChecklistEntriesInput } from "../inputs/ReorderChecklistEntriesInput";
import { ChecklistEntryObject } from "../objects/ChecklistEntryObject";

builder.mutationFields((t) => ({
  reorderChecklistEntries: t.field({
    type: [ChecklistEntryObject],
    args: {
      input: t.arg({ type: ReorderChecklistEntriesInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IChecklistService>(TYPES.ChecklistService);
      return service.reorderEntries({
        checklistId: input.checklistId,
        ids: input.ids,
        identityId,
      });
    },
  }),
}));
