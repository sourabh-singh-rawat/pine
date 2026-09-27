import { builder } from "@pine/server";
import type { ItemAttachment } from "@/db";
import { ITEM_ATTACHMENT_STATUS } from "@/features/item-attachments/constants";
import { getItemAttachmentProcessingLabel } from "@/features/item-attachments/utils";
import {
  ItemAttachmentProcessingObject,
  type ItemAttachmentProcessingObjectShape,
} from "./ItemAttachmentProcessingObject";

export const ItemAttachmentObject = builder.objectRef<ItemAttachment>("ItemAttachmentObject");

const toProcessing = (status: string): ItemAttachmentProcessingObjectShape | null => {
  if (status === ITEM_ATTACHMENT_STATUS.READY) {
    return null;
  }
  return { label: getItemAttachmentProcessingLabel(status) };
};

ItemAttachmentObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    itemId: t.exposeString("itemId"),
    attachmentId: t.exposeString("attachmentId", { nullable: true }),
    status: t.exposeString("status"),
    processing: t.field({
      type: ItemAttachmentProcessingObject,
      nullable: true,
      resolve: (parent) => toProcessing(parent.status),
    }),
    name: t.exposeString("name"),
    originalName: t.exposeString("originalName"),
    mimeType: t.exposeString("mimeType"),
    size: t.exposeInt("size", { nullable: true }),
    createdById: t.exposeString("createdById"),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
  }),
});
