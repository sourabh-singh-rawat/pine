import type { HttpRoute } from "@pine/server";
import { authorize } from "@/features/authorize/routes/authorize";

export * from "@/features/authorize/routes/authorize";

export const authorizeRoutes: HttpRoute[] = [authorize];
