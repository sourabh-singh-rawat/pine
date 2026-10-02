import type { HttpRoute } from "@pine/server";
import { introspect } from "@/features/token/routes/introspect";
import { token } from "@/features/token/routes/token";

export * from "@/features/token/routes/introspect";
export * from "@/features/token/routes/token";

export const tokenRoutes: HttpRoute[] = [token, introspect];
