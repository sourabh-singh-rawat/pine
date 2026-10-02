type ConsentScopeCopy = {
  title: string;
  description: string;
};

export const SCOPE_COPY: Record<string, ConsentScopeCopy> = {
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
