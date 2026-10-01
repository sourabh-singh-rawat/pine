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

export const formatConsentScope = (scope: string): ConsentScopeCopy => {
  const known = SCOPE_COPY[scope];
  if (known) {
    return known;
  }

  return {
    title: scope,
    description: "Additional access requested by this application.",
  };
};

export const getClientInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/[\s-_]+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};
