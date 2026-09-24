import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemAttachmentService } from "@/features/item";
import { CreateItemAttachmentInput } from "../inputs/CreateItemAttachmentInput";
import { ItemAttachmentObject } from "../objects/ItemAttachmentObject";

builder.mutationFields((t) => ({
  createItemAttachment: t.field({
    type: ItemAttachmentObject,
    args: {
      input: t.arg({ type: CreateItemAttachmentInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IItemAttachmentService>(TYPES.ItemAttachmentService);

      return service.create({
        itemId: input.itemId,
        attachmentId: input.attachmentId,
        name: input.name,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size ?? null,
        identityId,
      });
    },
  }),
}));
