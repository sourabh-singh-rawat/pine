import type { AuthorizeData } from "@generated/api";
import { client } from "@generated/api/client.gen";
import { createOidcBrowserAuth } from "@pine/auth";

export const {
  isAuthenticated,
  markAuthenticated,
  clearAuthenticated,
  getOidcState,
  setOidcState,
  clearOidcState,
  getOidcCodeVerifier,
  setOidcCodeVerifier,
  clearOidcCodeVerifier,
  startOidcSignIn,
  redirectToOidcSignIn,
} = createOidcBrowserAuth({
  storageKeys: {
    authenticated: "admin.authenticated",
    oidcState: "admin.oidc_state",
    oidcCodeVerifier: "admin.oidc_code_verifier",
  },
  getClientId: () => import.meta.env.VITE_PLATFORM_WEB_OIDC_CLIENT_ID,
  getRedirectUri: () => import.meta.env.VITE_PLATFORM_WEB_OIDC_REDIRECT_URI,
  getScope: () => import.meta.env.VITE_OIDC_SCOPES ?? "openid email",
  buildAuthorizeUrl: ({ clientId, redirectUri, scope, state, codeChallenge }) => {
    const query: AuthorizeData["query"] = {
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    };

    return client.buildUrl({
      url: "/identity/oauth/authorize",
      query,
    });
  },
});
