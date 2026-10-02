import type { HttpRoute } from "@pine/server";
import { acceptLogin } from "@/features/login/routes/acceptLogin";

export * from "@/features/login/routes/acceptLogin";

export const loginRoutes: HttpRoute[] = [acceptLogin];
