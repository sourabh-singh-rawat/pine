import Type from "typebox";

const CreateUploadTargetDataSchema = Type.Object(
  {
    objectId: Type.String(),
    url: Type.String(),
    headers: Type.Record(Type.String(), Type.String()),
    expiresAt: Type.String(),
  },
  { additionalProperties: false },
);

export const CreateUploadTargetResponseSchema = Type.Object(
  {
    data: CreateUploadTargetDataSchema,
  },
  { additionalProperties: false },
);

export type CreateUploadTargetResponse = Type.Static<typeof CreateUploadTargetDataSchema>;
