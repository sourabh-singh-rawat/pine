import { UnauthorizedError } from "@pine/common";
import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import {
  CreateUploadTargetBodySchema,
  CreateUploadTargetResponseSchema,
  type CreateUploadTargetResponse,
} from "@/features/attachment-upload/schemas";
import type { IAttachmentUploadService } from "@/features/attachment-upload/services";

export const createUploadTarget: HttpRoute = {
  url: "/internal/attachments/createUploadTarget",
  method: "POST",
  schema: {
    tags: ["attachment"],
    summary: "Create upload target",
    description: "Create an upload target for uploading attachment files",
    operationId: "createUploadTarget",
    body: CreateUploadTargetBodySchema,
    response: {
      200: CreateUploadTargetResponseSchema,
    },
  },
  handler: async (request) => {
    if (!request.identity) {
      throw new UnauthorizedError();
    }

    const body = request.body;
    if (!Value.Check(CreateUploadTargetBodySchema, body)) {
      throw new Error("Invalid create upload target body");
    }

    const service = container.get<IAttachmentUploadService>(TYPES.AttachmentUploadService);
    const target = await service.createUploadTarget({
      scopeType: body.scopeType,
      scopeId: body.scopeId,
      createdBy: request.identity.id,
      filename: body.filename,
      contentType: body.contentType,
      size: body.size,
      operationId: body.operationId,
      metadata: body.metadata,
    });

    const response: CreateUploadTargetResponse = {
      objectId: target.objectId,
      url: target.url,
      headers: target.headers,
      expiresAt: target.expiresAt.toISOString(),
    };

    return json(response);
  },
};
