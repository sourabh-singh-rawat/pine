import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { TYPES } from "@/bootstrap/container-types";
import {
  StoreAttachmentMetadataBodySchema,
  StoreAttachmentMetadataParamsSchema,
  StoreAttachmentMetadataResponseSchema,
  type StoreAttachmentMetadataResponse,
} from "@/features/attachment-metadatas/schemas";
import type { IAttachmentMetadataService } from "@/features/attachment-metadatas/services";

export const storeAttachmentMetadata: HttpRoute = {
  url: "/internal/attachments/:attachmentId/versions/:versionId/metadata",
  method: "POST",
  schema: {
    tags: ["attachment"],
    summary: "Store attachment metadata",
    description: "Store processed attachment image metadata and schedule event via outbox",
    operationId: "storeAttachmentMetadata",
    params: StoreAttachmentMetadataParamsSchema,
    body: StoreAttachmentMetadataBodySchema,
    response: {
      200: StoreAttachmentMetadataResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(StoreAttachmentMetadataParamsSchema, request.params)) {
      throw new Error("Invalid attachment metadata params");
    }

    if (!Value.Check(StoreAttachmentMetadataBodySchema, request.body)) {
      throw new Error("Invalid attachment metadata body");
    }

    const { attachmentId, versionId } = request.params;
    const body = request.body;

    const { container } = await import("@/bootstrap/container");
    const service = container.get<IAttachmentMetadataService>(TYPES.AttachmentMetadataService);

    const saved = await service.store({
      attachmentId,
      versionId,
      ...body,
    });

    const response: StoreAttachmentMetadataResponse = {
      metadataId: saved.id,
      attachmentId: saved.attachmentId,
      versionId: saved.versionId,
      width: saved.width ?? undefined,
      height: saved.height ?? undefined,
      format: saved.format ?? undefined,
      space: saved.space ?? undefined,
      channels: saved.channels ?? undefined,
      density: saved.density ?? undefined,
      hasAlpha: saved.hasAlpha ?? undefined,
      orientation: saved.orientation ?? undefined,
      extractedAt: saved.extractedAt.toISOString(),
    };

    return json(response);
  },
};
