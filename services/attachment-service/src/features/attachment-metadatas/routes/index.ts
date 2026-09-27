import type { HttpRoute } from "@pine/server";
import { storeAttachmentMetadata } from "./storeAttachmentMetadata";

export * from "./storeAttachmentMetadata";

export const attachmentMetadataRoutes: HttpRoute[] = [storeAttachmentMetadata];
