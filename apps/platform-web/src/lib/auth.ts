import type { AuthorizeData } from "@generated/api";
import { client } from "@generated/api/client.gen";
import { createCodeChallenge } from "@pine/auth";

const AUTHENTICATED_KEY = "admin.authenticated";
const OIDC_STATE_KEY = "admin.oidc_state";
const OIDC_CODE_VERIFIER_KEY = "admin.oidc_code_verifier";

export const isAuthenticated = (): boolean => sessionStorage.getItem(AUTHENTICATED_KEY) === "1";

export const markAuthenticated = (): void => {
  sessionStorage.setItem(AUTHENTICATED_KEY, "1");
};

export const clearAuthenticated = (): void => {
  sessionStorage.removeItem(AUTHENTICATED_KEY);
};

export const getOidcState = (): string | null => sessionStorage.getItem(OIDC_STATE_KEY);

export const setOidcState = (state: string): void => {
  sessionStorage.setItem(OIDC_STATE_KEY, state);
};

export const clearOidcState = (): void => {
  sessionStorage.removeItem(OIDC_STATE_KEY);
};

export const getOidcCodeVerifier = (): string | null =>
  sessionStorage.getItem(OIDC_CODE_VERIFIER_KEY);

export const setOidcCodeVerifier = (codeVerifier: string): void => {
  sessionStorage.setItem(OIDC_CODE_VERIFIER_KEY, codeVerifier);
};

export const clearOidcCodeVerifier = (): void => {
  sessionStorage.removeItem(OIDC_CODE_VERIFIER_KEY);
};

export const startOidcSignIn = async (): Promise<string> => {
  const state = crypto.randomUUID();
  const { codeVerifier, codeChallenge } = await createCodeChallenge();

  setOidcState(state);
  setOidcCodeVerifier(codeVerifier);

  const query: AuthorizeData["query"] = {
    response_type: "code",
    client_id: import.meta.env.VITE_PLATFORM_WEB_OIDC_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_PLATFORM_WEB_OIDC_REDIRECT_URI,
    scope: import.meta.env.VITE_OIDC_SCOPES ?? "openid email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  };

  return client.buildUrl({
    url: "/identity/oauth/authorize",
    query,
  });
};

export const redirectToOidcSignIn = (): void => {
  void startOidcSignIn().then((href) => {
    window.location.assign(href);
  });
};
