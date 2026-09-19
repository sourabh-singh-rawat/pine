import { describe, it, expect, vi } from "vitest";
import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
  OAuthRequestNotFoundError,
} from "@/integrations/oauth/errors";
import { HydraOAuthFlowProvider } from "@/integrations/oauth/HydraOAuthFlowProvider";

function createHydraMock(overrides?: {
  getOAuth2LoginRequest?: ReturnType<typeof vi.fn>;
  acceptOAuth2LoginRequest?: ReturnType<typeof vi.fn>;
  rejectOAuth2LoginRequest?: ReturnType<typeof vi.fn>;
  getOAuth2ConsentRequest?: ReturnType<typeof vi.fn>;
  acceptOAuth2ConsentRequest?: ReturnType<typeof vi.fn>;
  rejectOAuth2ConsentRequest?: ReturnType<typeof vi.fn>;
}) {
  return {
    publicUrl: "http://127.0.0.1:4444",
    adminApi: {
      getOAuth2LoginRequest: overrides?.getOAuth2LoginRequest ?? vi.fn(),
      acceptOAuth2LoginRequest: overrides?.acceptOAuth2LoginRequest ?? vi.fn(),
      rejectOAuth2LoginRequest: overrides?.rejectOAuth2LoginRequest ?? vi.fn(),
      getOAuth2ConsentRequest: overrides?.getOAuth2ConsentRequest ?? vi.fn(),
      acceptOAuth2ConsentRequest: overrides?.acceptOAuth2ConsentRequest ?? vi.fn(),
      rejectOAuth2ConsentRequest: overrides?.rejectOAuth2ConsentRequest ?? vi.fn(),
    },
    publicApi: {},
  };
}

describe("HydraOAuthFlowProvider.getAuthorizationUrl", () => {
  it("builds the Hydra public authorize URL with OAuth params", () => {
    const provider = new HydraOAuthFlowProvider(createHydraMock() as never);

    const url = provider.getAuthorizationUrl({
      clientId: "issues-web",
      redirectUri: "http://localhost:3000/callback",
      responseType: "code",
      scope: "openid offline",
      state: "state-1",
      codeChallenge: "challenge",
      codeChallengeMethod: "S256",
      nonce: "nonce-1",
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("http://127.0.0.1:4444/oauth2/auth");
    expect(parsed.searchParams.get("client_id")).toBe("issues-web");
    expect(parsed.searchParams.get("redirect_uri")).toBe("http://localhost:3000/callback");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("scope")).toBe("openid offline");
    expect(parsed.searchParams.get("state")).toBe("state-1");
    expect(parsed.searchParams.get("code_challenge")).toBe("challenge");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(parsed.searchParams.get("nonce")).toBe("nonce-1");
  });

  it("omits PKCE and nonce params when they are not provided", () => {
    const provider = new HydraOAuthFlowProvider(createHydraMock() as never);

    const url = provider.getAuthorizationUrl({
      clientId: "issues-web",
      redirectUri: "http://localhost:3000/callback",
      responseType: "code",
      scope: "openid",
      state: "state-1",
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.has("code_challenge")).toBe(false);
    expect(parsed.searchParams.has("code_challenge_method")).toBe(false);
    expect(parsed.searchParams.has("nonce")).toBe(false);
  });

  it("defaults code_challenge_method to S256 when only codeChallenge is set", () => {
    const provider = new HydraOAuthFlowProvider(createHydraMock() as never);

    const url = provider.getAuthorizationUrl({
      clientId: "issues-web",
      redirectUri: "http://localhost:3000/callback",
      responseType: "code",
      scope: "openid",
      state: "state-1",
      codeChallenge: "challenge-only",
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("code_challenge")).toBe("challenge-only");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
  });
});

describe("HydraOAuthFlowProvider.getLoginRequest", () => {
  it("maps a Hydra login request to the domain shape", async () => {
    const getOAuth2LoginRequest = vi.fn().mockResolvedValue({
      data: {
        challenge: "login-challenge-1",
        skip: false,
        subject: "",
        client: {
          client_id: "issues-web",
          client_name: "Issues Web",
          redirect_uris: ["http://localhost:3000/callback"],
        },
        requested_scope: ["openid", "offline"],
        request_url: "http://127.0.0.1:4444/oauth2/auth?...",
        session_id: "session-1",
      },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ getOAuth2LoginRequest }) as never,
    );

    await expect(provider.getLoginRequest("login-challenge-1")).resolves.toEqual({
      challenge: "login-challenge-1",
      skip: false,
      subject: undefined,
      client: {
        id: "issues-web",
        name: "Issues Web",
        redirectUris: ["http://localhost:3000/callback"],
      },
      requestedScope: ["openid", "offline"],
      requestUrl: "http://127.0.0.1:4444/oauth2/auth?...",
      sessionId: "session-1",
    });

    expect(getOAuth2LoginRequest).toHaveBeenCalledWith({
      loginChallenge: "login-challenge-1",
    });
  });

  it("throws OAuthRequestNotFoundError when Hydra returns 404", async () => {
    const getOAuth2LoginRequest = vi.fn().mockRejectedValue({
      response: { status: 404 },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ getOAuth2LoginRequest }) as never,
    );

    await expect(provider.getLoginRequest("missing")).rejects.toBeInstanceOf(
      OAuthRequestNotFoundError,
    );
  });

  it("throws InvalidOAuthRequestError when Hydra returns 400", async () => {
    const getOAuth2LoginRequest = vi.fn().mockRejectedValue({
      response: { status: 400 },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ getOAuth2LoginRequest }) as never,
    );

    await expect(provider.getLoginRequest("bad")).rejects.toBeInstanceOf(InvalidOAuthRequestError);
  });

  it("throws OAuthProviderUnavailableError when Hydra is down", async () => {
    const getOAuth2LoginRequest = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ getOAuth2LoginRequest }) as never,
    );

    await expect(provider.getLoginRequest("challenge")).rejects.toBeInstanceOf(
      OAuthProviderUnavailableError,
    );
  });
});

describe("HydraOAuthFlowProvider.acceptLoginRequest", () => {
  it("accepts a login challenge and returns the redirect URL", async () => {
    const acceptOAuth2LoginRequest = vi.fn().mockResolvedValue({
      data: { redirect_to: "http://127.0.0.1:4444/oauth2/auth?login_verifier=abc" },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ acceptOAuth2LoginRequest }) as never,
    );

    await expect(
      provider.acceptLoginRequest({
        challenge: "login-challenge-1",
        subject: "user-1",
        remember: true,
        rememberFor: 3600,
        identityProviderSessionId: "kratos-session-1",
      }),
    ).resolves.toEqual({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?login_verifier=abc",
    });

    expect(acceptOAuth2LoginRequest).toHaveBeenCalledWith({
      loginChallenge: "login-challenge-1",
      acceptOAuth2LoginRequest: {
        subject: "user-1",
        remember: true,
        remember_for: 3600,
        identity_provider_session_id: "kratos-session-1",
        context: undefined,
      },
    });
  });
});

describe("HydraOAuthFlowProvider.rejectLoginRequest", () => {
  it("rejects a login challenge and returns the redirect URL", async () => {
    const rejectOAuth2LoginRequest = vi.fn().mockResolvedValue({
      data: { redirect_to: "http://localhost:3000/callback?error=access_denied" },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ rejectOAuth2LoginRequest }) as never,
    );

    await expect(
      provider.rejectLoginRequest({
        challenge: "login-challenge-1",
        error: "access_denied",
        errorDescription: "The resource owner denied the request",
      }),
    ).resolves.toEqual({
      redirectTo: "http://localhost:3000/callback?error=access_denied",
    });

    expect(rejectOAuth2LoginRequest).toHaveBeenCalledWith({
      loginChallenge: "login-challenge-1",
      rejectOAuth2Request: {
        error: "access_denied",
        error_description: "The resource owner denied the request",
      },
    });
  });

  it("throws OAuthRequestNotFoundError when Hydra returns 404", async () => {
    const rejectOAuth2LoginRequest = vi.fn().mockRejectedValue({
      response: { status: 404 },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ rejectOAuth2LoginRequest }) as never,
    );

    await expect(provider.rejectLoginRequest({ challenge: "missing" })).rejects.toBeInstanceOf(
      OAuthRequestNotFoundError,
    );
  });
});

describe("HydraOAuthFlowProvider.getConsentRequest", () => {
  it("maps a Hydra consent request to the domain shape", async () => {
    const getOAuth2ConsentRequest = vi.fn().mockResolvedValue({
      data: {
        challenge: "consent-challenge-1",
        skip: true,
        subject: "user-1",
        client: { client_id: "issues-web", client_name: "Issues Web" },
        requested_scope: ["openid"],
        request_url: "http://127.0.0.1:4444/oauth2/auth?...",
        login_challenge: "login-challenge-1",
        login_session_id: "login-session-1",
      },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ getOAuth2ConsentRequest }) as never,
    );

    await expect(provider.getConsentRequest("consent-challenge-1")).resolves.toEqual({
      challenge: "consent-challenge-1",
      skip: true,
      subject: "user-1",
      client: {
        id: "issues-web",
        name: "Issues Web",
        redirectUris: undefined,
      },
      requestedScope: ["openid"],
      requestUrl: "http://127.0.0.1:4444/oauth2/auth?...",
      loginChallenge: "login-challenge-1",
      loginSessionId: "login-session-1",
    });
  });
});

describe("HydraOAuthFlowProvider.acceptConsentRequest", () => {
  it("accepts a consent challenge and returns the redirect URL", async () => {
    const acceptOAuth2ConsentRequest = vi.fn().mockResolvedValue({
      data: { redirect_to: "http://localhost:3000/callback?code=xyz" },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ acceptOAuth2ConsentRequest }) as never,
    );

    await expect(
      provider.acceptConsentRequest({
        challenge: "consent-challenge-1",
        grantScope: ["openid", "offline"],
        remember: true,
        rememberFor: 3600,
        accessTokenExtra: { role: "user" },
        idTokenExtra: { email: "a@b.com" },
      }),
    ).resolves.toEqual({
      redirectTo: "http://localhost:3000/callback?code=xyz",
    });

    expect(acceptOAuth2ConsentRequest).toHaveBeenCalledWith({
      consentChallenge: "consent-challenge-1",
      acceptOAuth2ConsentRequest: {
        grant_scope: ["openid", "offline"],
        remember: true,
        remember_for: 3600,
        session: {
          access_token: { role: "user" },
          id_token: { email: "a@b.com" },
        },
      },
    });
  });
});

describe("HydraOAuthFlowProvider.rejectConsentRequest", () => {
  it("rejects a consent challenge and returns the redirect URL", async () => {
    const rejectOAuth2ConsentRequest = vi.fn().mockResolvedValue({
      data: { redirect_to: "http://localhost:3000/callback?error=access_denied" },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ rejectOAuth2ConsentRequest }) as never,
    );

    await expect(
      provider.rejectConsentRequest({
        challenge: "consent-challenge-1",
        error: "access_denied",
        errorDescription: "The resource owner denied the request",
      }),
    ).resolves.toEqual({
      redirectTo: "http://localhost:3000/callback?error=access_denied",
    });

    expect(rejectOAuth2ConsentRequest).toHaveBeenCalledWith({
      consentChallenge: "consent-challenge-1",
      rejectOAuth2Request: {
        error: "access_denied",
        error_description: "The resource owner denied the request",
      },
    });
  });

  it("throws OAuthProviderUnavailableError when Hydra is down", async () => {
    const rejectOAuth2ConsentRequest = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });

    const provider = new HydraOAuthFlowProvider(
      createHydraMock({ rejectOAuth2ConsentRequest }) as never,
    );

    await expect(
      provider.rejectConsentRequest({ challenge: "consent-challenge-1" }),
    ).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
  });
});
