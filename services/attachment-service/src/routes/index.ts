import type { HttpRoute } from "@pine/server";
import { attachmentRoutes } from "@/features/attachment/routes";
import { attachmentUploadRoutes } from "@/features/attachment-upload/routes";

export const routes: HttpRoute[] = [...attachmentRoutes, ...attachmentUploadRoutes];
