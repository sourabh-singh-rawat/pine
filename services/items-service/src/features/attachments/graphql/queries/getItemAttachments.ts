import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemAttachmentService } from "@/features/attachments";
import { ItemAttachmentObject } from "../objects/ItemAttachmentObject";

builder.queryFields((t) => ({
  getItemAttachments: t.field({
    type: [ItemAttachmentObject],
    args: {
      itemId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { itemId }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IItemAttachmentService>(TYPES.ItemAttachmentService);
      return service.list({ itemId, identityId });
    },
  }),
}));
