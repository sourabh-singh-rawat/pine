import type { HttpRoute } from "@pine/server";
import { StatusCodes } from "http-status-codes";
import Value from "typebox/value";
import { TYPES } from "@/bootstrap/container-types";
import {
  StoreAttachmentDerivativeParamsSchema,
  StoreAttachmentDerivativeResponseSchema,
} from "@/features/attachment-derivatives/schemas";
import type { IAttachmentDerivativeService } from "@/features/attachment-derivatives/services";

export const storeAttachmentDerivative: HttpRoute = {
  url: "/internal/attachments/:attachmentId/versions/:versionId/derivatives/:derivativeType",
  method: "PUT",
  schema: {
    tags: ["attachment"],
    summary: "Store attachment derivative",
    description: "Store processed attachment derivative bytes (thumbnail or preview)",
    operationId: "storeAttachmentDerivative",
    params: StoreAttachmentDerivativeParamsSchema,
    response: {
      200: StoreAttachmentDerivativeResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(StoreAttachmentDerivativeParamsSchema, request.params)) {
      throw new Error("Invalid attachment derivative params");
    }

    const { attachmentId, versionId, derivativeType } = request.params;

    let buffer: Buffer | undefined;
    let contentType = request.headers["content-type"];

    if (request.isMultipart()) {
      const file = await request.file();
      if (file) {
        buffer = await file.toBuffer();
        contentType = file.mimetype;
      }
    } else if (Buffer.isBuffer(request.body)) {
      buffer = request.body;
    } else if (request.body instanceof Uint8Array) {
      buffer = Buffer.from(request.body);
    }

    if (!buffer) {
      throw new Error("No derivative data provided");
    }

    const rawWidth = request.headers["x-image-width"];
    const rawHeight = request.headers["x-image-height"];
    const width = typeof rawWidth === "string" ? parseInt(rawWidth, 10) : undefined;
    const height = typeof rawHeight === "string" ? parseInt(rawHeight, 10) : undefined;

    const { container } = await import("@/bootstrap/container");
    const service = container.get<IAttachmentDerivativeService>(TYPES.AttachmentDerivativeService);

    const derivative = await service.store({
      attachmentId,
      versionId,
      derivativeType,
      data: buffer,
      contentType: contentType ?? "image/png",
      width: Number.isNaN(width) ? undefined : width,
      height: Number.isNaN(height) ? undefined : height,
    });

    return {
      status: StatusCodes.OK,
      body: {
        derivativeId: derivative.id,
        attachmentId: derivative.attachmentId,
        versionId: derivative.versionId,
        derivativeType: derivative.derivativeType,
        mimeType: derivative.mimeType,
        fileSize: derivative.fileSize,
        width: derivative.width,
        height: derivative.height,
      },
    };
  },
};
