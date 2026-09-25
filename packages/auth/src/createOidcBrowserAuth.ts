import { createCodeChallenge } from "./createCodeChallenge";

export type OidcAuthStorageKeys = {
  authenticated: string;
  oidcState: string;
  oidcCodeVerifier: string;
};

export type OidcAuthorizeParams = {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
};

export type CreateOidcBrowserAuthOptions = {
  storageKeys: OidcAuthStorageKeys;
  getClientId: () => string;
  getRedirectUri: () => string;
  getScope?: () => string;
  buildAuthorizeUrl: (params: OidcAuthorizeParams) => string;
};

export type OidcBrowserAuth = {
  isAuthenticated: () => boolean;
  markAuthenticated: () => void;
  clearAuthenticated: () => void;
  getOidcState: () => string | null;
  setOidcState: (state: string) => void;
  clearOidcState: () => void;
  getOidcCodeVerifier: () => string | null;
  setOidcCodeVerifier: (codeVerifier: string) => void;
  clearOidcCodeVerifier: () => void;
  startOidcSignIn: () => Promise<string>;
  redirectToOidcSignIn: () => void;
};

const DEFAULT_SCOPE = "openid email";

export const createOidcBrowserAuth = (options: CreateOidcBrowserAuthOptions): OidcBrowserAuth => {
  const { storageKeys, getClientId, getRedirectUri, buildAuthorizeUrl } = options;
  const getScope = options.getScope ?? (() => DEFAULT_SCOPE);

  const isAuthenticated = (): boolean => sessionStorage.getItem(storageKeys.authenticated) === "1";

  const markAuthenticated = (): void => {
    sessionStorage.setItem(storageKeys.authenticated, "1");
  };

  const clearAuthenticated = (): void => {
    sessionStorage.removeItem(storageKeys.authenticated);
  };

  const getOidcState = (): string | null => sessionStorage.getItem(storageKeys.oidcState);

  const setOidcState = (state: string): void => {
    sessionStorage.setItem(storageKeys.oidcState, state);
  };

  const clearOidcState = (): void => {
    sessionStorage.removeItem(storageKeys.oidcState);
  };

  const getOidcCodeVerifier = (): string | null =>
    sessionStorage.getItem(storageKeys.oidcCodeVerifier);

  const setOidcCodeVerifier = (codeVerifier: string): void => {
    sessionStorage.setItem(storageKeys.oidcCodeVerifier, codeVerifier);
  };

  const clearOidcCodeVerifier = (): void => {
    sessionStorage.removeItem(storageKeys.oidcCodeVerifier);
  };

  const startOidcSignIn = async (): Promise<string> => {
    const state = crypto.randomUUID();
    const { codeVerifier, codeChallenge } = await createCodeChallenge();

    setOidcState(state);
    setOidcCodeVerifier(codeVerifier);

    return buildAuthorizeUrl({
      clientId: getClientId(),
      redirectUri: getRedirectUri(),
      scope: getScope(),
      state,
      codeChallenge,
    });
  };

  const redirectToOidcSignIn = (): void => {
    void startOidcSignIn().then((href) => {
      window.location.assign(href);
    });
  };

  return {
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
  };
};
