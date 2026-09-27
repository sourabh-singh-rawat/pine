import type { HttpRoute } from "@pine/server";
import { getAttachmentDerivative } from "./getAttachmentDerivative";
import { storeAttachmentDerivative } from "./storeAttachmentDerivative";

export * from "./getAttachmentDerivative";
export * from "./storeAttachmentDerivative";

export const attachmentDerivativeRoutes: HttpRoute[] = [
  getAttachmentDerivative,
  storeAttachmentDerivative,
];
