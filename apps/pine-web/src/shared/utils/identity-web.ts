export const getIdentityWebBaseUrl = (): string => {
  const base = import.meta.env.VITE_IDENTITY_WEB_URL ?? "https://localhost:3000";
  return base.replace(/\/$/, "");
};

export const getIdentityWebSignInUrl = (): string => {
  return `${getIdentityWebBaseUrl()}/signin`;
};

export const redirectToIdentityWeb = (): void => {
  window.location.assign(getIdentityWebBaseUrl());
};

export const redirectToIdentitySignIn = (): void => {
  window.location.assign(getIdentityWebSignInUrl());
};
