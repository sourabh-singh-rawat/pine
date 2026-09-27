import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IStatusService } from "@/features/item-statuses";
import { DeleteStatusInput } from "../inputs/DeleteStatusInput";

builder.mutationFields((t) => ({
  deleteStatus: t.field({
    type: "Boolean",
    args: {
      input: t.arg({ type: DeleteStatusInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IStatusService>(TYPES.StatusService);
      await service.delete({
        id: String(input.id),
        replacementStatusId: input.replacementStatusId
          ? String(input.replacementStatusId)
          : undefined,
        identityId: requireIdentityId(ctx),
      });
      return true;
    },
  }),
}));
