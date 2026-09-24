import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IItemAttachmentService } from "@/features/attachments";

builder.mutationFields((t) => ({
  deleteItemAttachment: t.boolean({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const identityId = requireIdentityId(ctx);
      const service = container.get<IItemAttachmentService>(TYPES.ItemAttachmentService);
      await service.delete({ id, identityId });
      return true;
    },
  }),
}));
