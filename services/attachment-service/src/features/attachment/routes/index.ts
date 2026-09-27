import type { HttpRoute } from "@pine/server";
import { getAttachmentContent } from "./getAttachmentContent";
import { getAttachmentVersionContent } from "./getAttachmentVersionContent";
import { storeAttachmentDerivative } from "./storeAttachmentDerivative";
import { updateSecurityStatus } from "./updateSecurityStatus";

export * from "./getAttachmentContent";
export * from "./getAttachmentVersionContent";
export * from "./storeAttachmentDerivative";
export * from "./updateSecurityStatus";

export const attachmentRoutes: HttpRoute[] = [
  getAttachmentContent,
  getAttachmentVersionContent,
  storeAttachmentDerivative,
  updateSecurityStatus,
];
