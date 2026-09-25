import Type from "typebox";

export const GetAttachmentVersionContentParamsSchema = Type.Object(
  {
    attachmentId: Type.String({ format: "uuid" }),
    versionId: Type.String({ format: "uuid" }),
  },
  { additionalProperties: false },
);

export type GetAttachmentVersionContentParams = Type.Static<
  typeof GetAttachmentVersionContentParamsSchema
>;
