import type { ConsentScopeDetail } from "@/features/consent/schemas";

type ConsentScopeCopy = {
  title: string;
  description: string;
};

const SCOPE_COPY: Record<string, ConsentScopeCopy> = {
  openid: {
    title: "Verify your identity",
    description: "Confirm who you are when you sign in.",
  },
  email: {
    title: "View your email address",
    description: "See the email on your Pine account.",
  },
  profile: {
    title: "View your profile",
    description: "See your name and profile details.",
  },
  offline_access: {
    title: "Stay signed in",
    description: "Refresh your session without signing in again.",
  },
  offline: {
    title: "Stay signed in",
    description: "Refresh your session without signing in again.",
  },
};

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
