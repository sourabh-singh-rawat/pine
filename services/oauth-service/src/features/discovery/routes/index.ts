import type { HttpRoute } from "@pine/server";
import { getJwks } from "@/features/discovery/routes/getJwks";
import { getOpenIdConfiguration } from "@/features/discovery/routes/getOpenIdConfiguration";

export * from "@/features/discovery/routes/getOpenIdConfiguration";
export * from "@/features/discovery/routes/getJwks";

export const discoveryRoutes: HttpRoute[] = [getOpenIdConfiguration, getJwks];
