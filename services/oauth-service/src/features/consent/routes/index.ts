import type { HttpRoute } from "@pine/server";
import { acceptConsent } from "@/features/consent/routes/acceptConsent";
import { consent } from "@/features/consent/routes/consent";
import { rejectConsent } from "@/features/consent/routes/rejectConsent";

export * from "@/features/consent/routes/acceptConsent";
export * from "@/features/consent/routes/consent";
export * from "@/features/consent/routes/rejectConsent";

export const consentRoutes: HttpRoute[] = [consent, acceptConsent, rejectConsent];
