import type { HttpRoute } from "@pine/server";
import { createOAuthClient } from "@/features/clients/routes/createOAuthClient";
import { deleteOAuthClient } from "@/features/clients/routes/deleteOAuthClient";
import { getOAuthClient } from "@/features/clients/routes/getOAuthClient";

export * from "@/features/clients/routes/createOAuthClient";
export * from "@/features/clients/routes/deleteOAuthClient";
export * from "@/features/clients/routes/getOAuthClient";

export const clientRoutes: HttpRoute[] = [createOAuthClient, getOAuthClient, deleteOAuthClient];
