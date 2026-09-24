import { builder } from "@pine/server";
import type { ItemAttachment } from "@/db";

export const ItemAttachmentObject = builder.objectRef<ItemAttachment>("ItemAttachmentObject");

ItemAttachmentObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    itemId: t.exposeString("itemId"),
    attachmentId: t.exposeString("attachmentId"),
    name: t.exposeString("name"),
    originalName: t.exposeString("originalName"),
    mimeType: t.exposeString("mimeType"),
    size: t.exposeInt("size", { nullable: true }),
    createdById: t.exposeString("createdById"),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
  }),
});
