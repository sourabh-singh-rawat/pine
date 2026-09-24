import { builder } from "@pine/server";
import type { CreateItemAttachmentUploadRequestResult } from "@/features/attachments/services";

export const ItemAttachmentUploadHeaderObject = builder
  .objectRef<{ key: string; value: string }>("ItemAttachmentUploadHeaderObject")
  .implement({
    fields: (t) => ({
      key: t.exposeString("key"),
      value: t.exposeString("value"),
    }),
  });

export const ItemAttachmentUploadTargetObject = builder
  .objectRef<CreateItemAttachmentUploadRequestResult>("ItemAttachmentUploadTargetObject")
  .implement({
    fields: (t) => ({
      uploadRequestId: t.exposeString("uploadRequestId"),
      url: t.exposeString("url"),
      expiresAt: t.exposeString("expiresAt"),
      headers: t.field({
        type: [ItemAttachmentUploadHeaderObject],
        resolve: (target) =>
          Object.entries(target.headers).map(([key, value]) => ({
            key,
            value,
          })),
      }),
    }),
  });
