import { requireIdentity } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemAttachmentService } from "@/features/item";
import { CreateItemAttachmentUploadRequestInput } from "../inputs/CreateItemAttachmentUploadRequestInput";
import { ItemAttachmentUploadTargetObject } from "../objects/ItemAttachmentUploadTargetObject";

builder.mutationFields((t) => ({
  createItemAttachmentUploadRequest: t.field({
    type: ItemAttachmentUploadTargetObject,
    args: {
      input: t.arg({ type: CreateItemAttachmentUploadRequestInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const identity = requireIdentity(ctx);
      const service = container.get<IItemAttachmentService>(TYPES.ItemAttachmentService);

      return service.createUploadRequest({
        itemId: input.itemId,
        filename: input.filename,
        contentType: input.contentType,
        size: input.size,
        identityId: identity.id,
        authMethod: identity.authMethod,
      });
    },
  }),
}));
