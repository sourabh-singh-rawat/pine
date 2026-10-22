import type { HttpRoute } from "@pine/server";
import { logoutRoutes } from "@/features/logout";
import { meRoutes } from "@/features/me";
import { profileRoutes } from "@/features/profiles/routes";
import { registrationRoutes } from "@/features/registration";
import { sessionRoutes } from "@/features/session";
import { signinRoutes } from "@/features/signin";
import { verificationRoutes } from "@/features/verification";

export const routes: HttpRoute[] = [
  ...signinRoutes,
  ...logoutRoutes,
  ...meRoutes,
  ...profileRoutes,
  ...sessionRoutes,
  ...registrationRoutes,
  ...verificationRoutes,
];
