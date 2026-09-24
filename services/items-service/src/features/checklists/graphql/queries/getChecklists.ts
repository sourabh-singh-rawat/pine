import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { IChecklistService } from "@/features/checklists/services";
import {
  ChecklistObject,
  toChecklistObjectShape,
} from "../objects/ChecklistObject";

builder.queryFields((t) => ({
  getChecklists: t.field({
    type: [ChecklistObject],
    args: {
      itemId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { itemId }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IChecklistService>(TYPES.ChecklistService);
      const rows = await service.list({ itemId, identityId });
      return rows.map(toChecklistObjectShape);
    },
  }),
}));
