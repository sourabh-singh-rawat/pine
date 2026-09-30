import { builder } from "@pine/server";

export type ItemAttachmentProcessingObjectShape = {
  label: string;
};

export const ItemAttachmentProcessingObject =
  builder.objectRef<ItemAttachmentProcessingObjectShape>("ItemAttachmentProcessingObject");

ItemAttachmentProcessingObject.implement({
  fields: (t) => ({
    label: t.exposeString("label"),
  }),
});
