import type { HttpRoute } from "@pine/server";
import { StatusCodes } from "http-status-codes";
import Value from "typebox/value";
import { TYPES } from "@/bootstrap/container-types";
import { GetAttachmentDerivativeParamsSchema } from "@/features/attachment-derivatives/schemas";
import type { IAttachmentDerivativeService } from "@/features/attachment-derivatives/services";

export const getAttachmentDerivative: HttpRoute = {
  url: "/attachments/:attachmentId/derivatives/:derivativeType",
  method: "GET",
  schema: {
    tags: ["attachment"],
    summary: "Get attachment derivative content stream",
    description: "Download thumbnail or preview derivative for an attachment current version",
    operationId: "getAttachmentDerivative",
    params: GetAttachmentDerivativeParamsSchema,
  },
  handler: async (request) => {
    if (!Value.Check(GetAttachmentDerivativeParamsSchema, request.params)) {
      throw new Error("Invalid attachment derivative params");
    }

    const { attachmentId, derivativeType } = request.params;
    const { container } = await import("@/bootstrap/container");
    const service = container.get<IAttachmentDerivativeService>(TYPES.AttachmentDerivativeService);
    const content = await service.getContent({
      attachmentId,
      derivativeType,
    });

    return {
      status: StatusCodes.OK,
      headers: {
        "content-type": content.contentType,
        "content-length": content.fileSize.toString(),
        "content-disposition": `inline; filename="${encodeURIComponent(content.filename)}"`,
      },
      body: content.stream,
    };
  },
};
