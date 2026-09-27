import type { HttpRoute } from "@pine/server";
import { getAttachmentContent } from "./getAttachmentContent";
import { getAttachmentVersionContent } from "./getAttachmentVersionContent";
import { updateSecurityStatus } from "./updateSecurityStatus";

export * from "./getAttachmentContent";
export * from "./getAttachmentVersionContent";
export * from "./updateSecurityStatus";

export const attachmentRoutes: HttpRoute[] = [
  getAttachmentContent,
  getAttachmentVersionContent,
  updateSecurityStatus,
];
