import Type from "typebox";

export const GetAttachmentContentParamsSchema = Type.Object({
  attachmentId: Type.String(),
});

export type GetAttachmentContentParams = Type.Static<typeof GetAttachmentContentParamsSchema>;
