import Type from "typebox";

export const AttachmentCreatedDataSchema = Type.Object(
  {
    id: Type.String(),
    scopeType: Type.Union([Type.Literal("IDENTITY"), Type.Literal("ORGANIZATION")]),
    scopeId: Type.String(),
    tenantId: Type.Optional(Type.String()),
    currentVersionId: Type.Optional(Type.String()),
    operationId: Type.Optional(Type.String()),
    contentType: Type.Optional(Type.String()),
    metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    url: Type.Optional(Type.String()),
    status: Type.String(),
    securityStatus: Type.String(),
    createdBy: Type.String(),
    createdAt: Type.String(),
  },
  { additionalProperties: false },
);

export type AttachmentCreatedData = Type.Static<typeof AttachmentCreatedDataSchema>;
