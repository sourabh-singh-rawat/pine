import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IChecklistService } from "@/features/checklists/services";

builder.mutationFields((t) => ({
  deleteChecklistEntry: t.boolean({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IChecklistService>(TYPES.ChecklistService);
      await service.deleteEntry({ id, identityId });
      return true;
    },
  }),
}));
