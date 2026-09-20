import { describe, it, expect, vi } from "vitest";
import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
  OAuthRequestNotFoundError,
} from "@/integrations/oauth/errors";
import { OAuthService } from "@/features/oauth/services/OAuthService";

function createFlowProviderMock(
  overrides: Partial<{
    getAuthorizationUrl: ReturnType<typeof vi.fn>;
    getConsentRequest: ReturnType<typeof vi.fn>;
    acceptConsentRequest: ReturnType<typeof vi.fn>;
    rejectConsentRequest: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    getAuthorizationUrl: overrides.getAuthorizationUrl ?? vi.fn(),
    getLoginRequest: vi.fn(),
    acceptLoginRequest: vi.fn(),
    rejectLoginRequest: vi.fn(),
    getConsentRequest: overrides.getConsentRequest ?? vi.fn(),
    acceptConsentRequest: overrides.acceptConsentRequest ?? vi.fn(),
    rejectConsentRequest: overrides.rejectConsentRequest ?? vi.fn(),
  };
}

function createTokenProviderMock(
  overrides: Partial<{
    exchangeToken: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    exchangeToken: overrides.exchangeToken ?? vi.fn(),
    introspectToken: vi.fn(),
    revokeToken: vi.fn(),
  };
}

function createService(
  flowOverrides: Parameters<typeof createFlowProviderMock>[0] = {},
  tokenOverrides: Parameters<typeof createTokenProviderMock>[0] = {},
) {
  return new OAuthService(
    createFlowProviderMock(flowOverrides) as never,
    createTokenProviderMock(tokenOverrides) as never,
  );
}

describe("OAuthService.authorize", () => {
  it("builds the authorization URL via the OAuth flow provider", async () => {
    const getAuthorizationUrl = vi
      .fn()
      .mockReturnValue("http://127.0.0.1:4444/oauth2/auth?client_id=issues-web");
    const service = createService({ getAuthorizationUrl });

    await expect(
      service.authorize({
        clientId: "issues-web",
        redirectUri: "http://localhost:3000/callback",
        responseType: "code",
        scope: "openid offline",
        state: "state-1",
      }),
    ).resolves.toEqual({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?client_id=issues-web",
    });

    expect(getAuthorizationUrl).toHaveBeenCalledTimes(1);
    expect(getAuthorizationUrl).toHaveBeenCalledWith({
      clientId: "issues-web",
      redirectUri: "http://localhost:3000/callback",
      responseType: "code",
      scope: "openid offline",
      state: "state-1",
      codeChallenge: undefined,
      codeChallengeMethod: undefined,
      nonce: undefined,
    });
  });

  it("forwards codeChallenge, codeChallengeMethod, and nonce to the OAuth flow provider", async () => {
    const getAuthorizationUrl = vi
      .fn()
      .mockReturnValue("http://127.0.0.1:4444/oauth2/auth?client_id=issues-web");
    const service = createService({ getAuthorizationUrl });

    await service.authorize({
      clientId: "issues-web",
      redirectUri: "http://localhost:3000/callback",
      responseType: "code",
      scope: "openid offline",
      state: "state-1",
      codeChallenge: "challenge",
      codeChallengeMethod: "S256",
      nonce: "nonce-1",
    });

    expect(getAuthorizationUrl).toHaveBeenCalledWith({
      clientId: "issues-web",
      redirectUri: "http://localhost:3000/callback",
      responseType: "code",
      scope: "openid offline",
      state: "state-1",
      codeChallenge: "challenge",
      codeChallengeMethod: "S256",
      nonce: "nonce-1",
    });
  });

  it("returns the redirect URL produced by the provider without modification", async () => {
    const redirectTo =
      "http://127.0.0.1:4444/oauth2/auth?client_id=issues-web&state=abc&scope=openid";
    const getAuthorizationUrl = vi.fn().mockReturnValue(redirectTo);
    const service = createService({ getAuthorizationUrl });

    await expect(
      service.authorize({
        clientId: "issues-web",
        redirectUri: "http://localhost:3000/callback",
        responseType: "code",
        scope: "openid",
        state: "abc",
      }),
    ).resolves.toEqual({ redirectTo });
  });

  it("propagates provider errors during authorize", async () => {
    const getAuthorizationUrl = vi.fn().mockImplementation(() => {
      throw new InvalidOAuthRequestError();
    });
    const service = createService({ getAuthorizationUrl });

    await expect(
      service.authorize({
        clientId: "issues-web",
        redirectUri: "http://localhost:3000/callback",
        responseType: "code",
        scope: "openid",
        state: "state-1",
      }),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
  });
});

describe("OAuthService login challenge flow", () => {
  it.todo("loads a login challenge from the OAuth provider by challenge id");

  it.todo("accepts a login challenge for an authenticated subject and returns redirectTo");

  it.todo("accepts a login challenge with remember / rememberFor and identity provider session id");

  it.todo("auto-accepts a skipable login challenge when the subject already has a session");

  it.todo("rejects a login challenge with an error code and description and returns redirectTo");

  it.todo("propagates OAuthRequestNotFoundError when the login challenge is unknown");

  it.todo("propagates InvalidOAuthRequestError when the login challenge is invalid");

  it.todo("propagates OAuthProviderUnavailableError when the OAuth provider is down");
});

describe("OAuthService consent challenge flow", () => {
  it("loads a consent challenge from the OAuth flow provider by challenge id", async () => {
    const consentChallenge = {
      challenge: "consent-challenge-1",
      skip: false,
      subject: "user-1",
      client: { id: "issues-web", name: "Issues Web" },
      requestedScope: ["openid"],
      requestUrl: "http://127.0.0.1:4444/oauth2/auth?...",
      loginChallenge: "login-challenge-1",
      loginSessionId: "login-session-1",
    };
    const getConsentRequest = vi.fn().mockResolvedValue(consentChallenge);
    const service = createService({ getConsentRequest });

    await expect(service.getConsentChallenge("consent-challenge-1")).resolves.toEqual(
      consentChallenge,
    );
    expect(getConsentRequest).toHaveBeenCalledWith("consent-challenge-1");
  });

  it("accepts a consent challenge with granted scopes and returns redirectTo", async () => {
    const acceptConsentRequest = vi.fn().mockResolvedValue({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?consent_verifier=abc",
    });
    const service = createService({ acceptConsentRequest });

    await expect(
      service.acceptConsent({
        challenge: "consent-challenge-1",
        grantScope: ["openid", "offline"],
      }),
    ).resolves.toEqual({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?consent_verifier=abc",
    });
    expect(acceptConsentRequest).toHaveBeenCalledWith({
      challenge: "consent-challenge-1",
      grantScope: ["openid", "offline"],
      remember: undefined,
      rememberFor: undefined,
    });
  });

  it("accepts consent with remember options", async () => {
    const acceptConsentRequest = vi.fn().mockResolvedValue({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?consent_verifier=abc",
    });
    const service = createService({ acceptConsentRequest });

    await expect(
      service.acceptConsent({
        challenge: "consent-challenge-1",
        grantScope: ["openid"],
        remember: true,
        rememberFor: 3600,
      }),
    ).resolves.toEqual({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?consent_verifier=abc",
    });
    expect(acceptConsentRequest).toHaveBeenCalledWith({
      challenge: "consent-challenge-1",
      grantScope: ["openid"],
      remember: true,
      rememberFor: 3600,
    });
  });

  it("rejects a consent challenge with an error code and description and returns redirectTo", async () => {
    const rejectConsentRequest = vi.fn().mockResolvedValue({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?error=access_denied",
    });
    const service = createService({ rejectConsentRequest });

    await expect(
      service.rejectConsent({
        challenge: "consent-challenge-1",
        error: "access_denied",
        errorDescription: "User denied consent",
      }),
    ).resolves.toEqual({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?error=access_denied",
    });
    expect(rejectConsentRequest).toHaveBeenCalledWith({
      challenge: "consent-challenge-1",
      error: "access_denied",
      errorDescription: "User denied consent",
    });
  });

  it("propagates OAuthRequestNotFoundError when the consent challenge is unknown", async () => {
    const getConsentRequest = vi.fn().mockRejectedValue(new OAuthRequestNotFoundError());
    const service = createService({ getConsentRequest });

    await expect(service.getConsentChallenge("missing")).rejects.toBeInstanceOf(
      OAuthRequestNotFoundError,
    );
  });

  it("propagates InvalidOAuthRequestError when the consent challenge is invalid", async () => {
    const getConsentRequest = vi.fn().mockRejectedValue(new InvalidOAuthRequestError());
    const service = createService({ getConsentRequest });

    await expect(service.getConsentChallenge("bad")).rejects.toBeInstanceOf(
      InvalidOAuthRequestError,
    );
  });

  it("propagates OAuthProviderUnavailableError when the OAuth provider is down", async () => {
    const getConsentRequest = vi.fn().mockRejectedValue(new OAuthProviderUnavailableError());
    const service = createService({ getConsentRequest });

    await expect(service.getConsentChallenge("consent-challenge-1")).rejects.toBeInstanceOf(
      OAuthProviderUnavailableError,
    );
  });
});

describe("OAuthService.exchangeToken", () => {
  it("exchanges an authorization code via the OAuth token provider", async () => {
    const exchangeToken = vi.fn().mockResolvedValue({
      accessToken: "access-1",
      tokenType: "bearer",
      expiresIn: 3600,
      refreshToken: "refresh-1",
      idToken: "id-1",
      scope: "openid offline",
    });
    const service = createService({}, { exchangeToken });

    await expect(
      service.exchangeToken({
        grantType: "authorization_code",
        code: "auth-code-1",
        clientId: "pine-web",
        redirectUri: "http://localhost:3001/callback",
        codeVerifier: "verifier-1",
      }),
    ).resolves.toEqual({
      accessToken: "access-1",
      tokenType: "bearer",
      expiresIn: 3600,
      refreshToken: "refresh-1",
      idToken: "id-1",
      scope: "openid offline",
    });

    expect(exchangeToken).toHaveBeenCalledWith({
      grantType: "authorization_code",
      clientId: "pine-web",
      code: "auth-code-1",
      redirectUri: "http://localhost:3001/callback",
      codeVerifier: "verifier-1",
    });
  });

  it("propagates InvalidOAuthRequestError from the OAuth token provider", async () => {
    const exchangeToken = vi.fn().mockRejectedValue(new InvalidOAuthRequestError());
    const service = createService({}, { exchangeToken });

    await expect(
      service.exchangeToken({
        grantType: "authorization_code",
        code: "bad-code",
        clientId: "pine-web",
        redirectUri: "http://localhost:3001/callback",
        codeVerifier: "verifier-1",
      }),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
  });

  it("propagates OAuthProviderUnavailableError when the OAuth provider is down", async () => {
    const exchangeToken = vi.fn().mockRejectedValue(new OAuthProviderUnavailableError());
    const service = createService({}, { exchangeToken });

    await expect(
      service.exchangeToken({
        grantType: "authorization_code",
        code: "auth-code-1",
        clientId: "pine-web",
        redirectUri: "http://localhost:3001/callback",
        codeVerifier: "verifier-1",
      }),
    ).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
  });
});

describe("OAuthService token operations", () => {
  it.todo("introspects an access token and returns the mapped result");

  it.todo("introspects an access token with an optional required scope");

  it.todo("returns inactive when the token is expired or revoked");

  it.todo("revokes an access or refresh token via the OAuth provider");

  it.todo("propagates OAuthProviderUnavailableError when token operations fail");
});
