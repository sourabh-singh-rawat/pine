import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IChecklistService } from "@/features/checklists/services";
import { CreateChecklistEntryInput } from "../inputs/CreateChecklistEntryInput";
import { ChecklistEntryObject } from "../objects/ChecklistEntryObject";

builder.mutationFields((t) => ({
  createChecklistEntry: t.field({
    type: ChecklistEntryObject,
    args: {
      input: t.arg({ type: CreateChecklistEntryInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IChecklistService>(TYPES.ChecklistService);
      return service.createEntry({
        checklistId: input.checklistId,
        title: input.title,
        identityId,
      });
    },
  }),
}));
