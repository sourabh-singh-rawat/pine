import type { HttpRoute } from "@pine/server";
import { getAttachmentContent } from "./getAttachmentContent";
import { getAttachmentVersionContent } from "./getAttachmentVersionContent";

export * from "./getAttachmentContent";
export * from "./getAttachmentVersionContent";

export const attachmentRoutes: HttpRoute[] = [getAttachmentContent, getAttachmentVersionContent];
