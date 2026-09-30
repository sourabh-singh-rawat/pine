import { NotFoundError } from "@pine/common";
import type { HttpRoute } from "@pine/server";
import { StatusCodes } from "http-status-codes";
import Value from "typebox/value";
import { TYPES } from "@/bootstrap/container-types";
import {
  UpdateSecurityStatusBodySchema,
  UpdateSecurityStatusParamsSchema,
  UpdateSecurityStatusResponseSchema,
} from "@/features/attachment/schemas";
import type { IAttachmentService } from "@/features/attachment/services";

export const updateSecurityStatus: HttpRoute = {
  url: "/internal/attachments/:attachmentId/security-status",
  method: "POST",
  schema: {
    tags: ["attachment"],
    summary: "Update attachment security status",
    description: "Record malware scan result and promote or reject the attachment",
    operationId: "updateSecurityStatus",
    params: UpdateSecurityStatusParamsSchema,
    body: UpdateSecurityStatusBodySchema,
    response: {
      200: UpdateSecurityStatusResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(UpdateSecurityStatusParamsSchema, request.params)) {
      throw new Error("Invalid attachment security status params");
    }

    if (!Value.Check(UpdateSecurityStatusBodySchema, request.body)) {
      throw new Error("Invalid attachment security status body");
    }

    const { attachmentId } = request.params;
    const { status } = request.body;

    const { container } = await import("@/bootstrap/container");
    const service = container.get<IAttachmentService>(TYPES.AttachmentService);

    const updated = await service.updateSecurityStatus({
      id: attachmentId,
      status,
    });

    if (!updated) {
      throw new NotFoundError("Attachment");
    }

    return {
      status: StatusCodes.OK,
      body: {
        attachmentId: updated.id,
        status: updated.status,
        securityStatus: updated.securityStatus,
      },
    };
  },
};
