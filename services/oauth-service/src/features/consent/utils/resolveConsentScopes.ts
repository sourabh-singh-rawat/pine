import { SCOPE_COPY } from "@/features/consent/constants";
import type { ConsentScopeDetail } from "@/features/consent/schemas";

export const resolveConsentScopes = (requestedScopes: string[]): ConsentScopeDetail[] => {
  return requestedScopes.map((scope) => {
    const known = SCOPE_COPY[scope];
    if (known) {
      return {
        scope,
        title: known.title,
        description: known.description,
      };
    }

    return {
      scope,
      title: scope,
      description: "Additional access requested by this application.",
    };
  });
};
