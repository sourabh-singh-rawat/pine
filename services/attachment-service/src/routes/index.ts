import type { HttpRoute } from "@pine/server";
import { attachmentRoutes } from "@/features/attachment/routes";
import { attachmentDerivativeRoutes } from "@/features/attachment-derivatives/routes";
import { attachmentUploadRoutes } from "@/features/attachment-upload/routes";

export const routes: HttpRoute[] = [
  ...attachmentDerivativeRoutes,
  ...attachmentRoutes,
  ...attachmentUploadRoutes,
];
