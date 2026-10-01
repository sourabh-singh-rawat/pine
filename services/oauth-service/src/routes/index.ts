import type { HttpRoute } from "@pine/server";
import { authorizeRoutes } from "@/features/authorize";
import { clientRoutes } from "@/features/clients";
import { consentRoutes } from "@/features/consent";
import { loginRoutes } from "@/features/login";
import { tokenRoutes } from "@/features/token";

export const routes: HttpRoute[] = [
  ...authorizeRoutes,
  ...loginRoutes,
  ...consentRoutes,
  ...tokenRoutes,
  ...clientRoutes,
];
