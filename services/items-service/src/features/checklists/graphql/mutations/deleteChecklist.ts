import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IChecklistService } from "@/features/checklists/services";

builder.mutationFields((t) => ({
  deleteChecklist: t.boolean({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IChecklistService>(TYPES.ChecklistService);
      await service.delete({ id, identityId });
      return true;
    },
  }),
}));
