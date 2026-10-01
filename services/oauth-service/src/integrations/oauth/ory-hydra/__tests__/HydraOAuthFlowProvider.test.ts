import { afterEach, describe, expect, it, vi } from "vitest";
import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
  OAuthRequestNotFoundError,
} from "@/integrations/oauth/errors";
import { HydraOAuthFlowProvider } from "@/integrations/oauth/ory-hydra/HydraOAuthFlowProvider";

const createHydraMock = (overrides?: {
  getOAuth2LoginRequest?: ReturnType<typeof vi.fn>;
  acceptOAuth2LoginRequest?: ReturnType<typeof vi.fn>;
  rejectOAuth2LoginRequest?: ReturnType<typeof vi.fn>;
  getOAuth2ConsentRequest?: ReturnType<typeof vi.fn>;
  acceptOAuth2ConsentRequest?: ReturnType<typeof vi.fn>;
  rejectOAuth2ConsentRequest?: ReturnType<typeof vi.fn>;
}) => ({
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
});

describe("HydraOAuthFlowProvider.forwardAuthorization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("proxies authorize to Hydra and rewrites Hydra Location headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          Location: "http://127.0.0.1:4444/oauth2/auth?login_verifier=abc",
          "Set-Cookie": "ory_hydra_session=s1; Path=/; HttpOnly; SameSite=Lax",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new HydraOAuthFlowProvider(createHydraMock());

    await expect(
      provider.forwardAuthorization({
        search: "?client_id=pine-web&response_type=code",
        cookieHeader: "existing=1",
      }),
    ).resolves.toEqual({
      status: 302,
      location: "https://localhost/api/oauth/authorize?login_verifier=abc",
      cookies: [
        {
          name: "ory_hydra_session",
          value: "s1",
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: true,
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://127.0.0.1:4444/oauth2/auth?client_id=pine-web&response_type=code"),
      {
        method: "GET",
        redirect: "manual",
        headers: { cookie: "existing=1" },
      },
    );
  });

  it("leaves login UI Location headers unchanged", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          Location: "https://localhost:3000/signin?login_challenge=abc",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new HydraOAuthFlowProvider(createHydraMock());

    await expect(
      provider.forwardAuthorization({
        search: "?client_id=pine-web&response_type=code",
      }),
    ).resolves.toMatchObject({
      status: 302,
      location: "https://localhost:3000/signin?login_challenge=abc",
      cookies: [],
    });
  });

  it("throws OAuthProviderUnavailableError when Hydra is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const provider = new HydraOAuthFlowProvider(createHydraMock());

    await expect(
      provider.forwardAuthorization({ search: "?client_id=pine-web" }),
    ).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
  });
});

describe("HydraOAuthFlowProvider.getLoginRequest", () => {
  it("maps a Hydra login request to the domain shape without Hydra request URLs", async () => {
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

    const provider = new HydraOAuthFlowProvider(createHydraMock({ getOAuth2LoginRequest }));

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

    const provider = new HydraOAuthFlowProvider(createHydraMock({ getOAuth2LoginRequest }));

    await expect(provider.getLoginRequest("missing")).rejects.toBeInstanceOf(
      OAuthRequestNotFoundError,
    );
  });

  it("throws InvalidOAuthRequestError when Hydra returns 400", async () => {
    const getOAuth2LoginRequest = vi.fn().mockRejectedValue({
      response: { status: 400 },
    });

    const provider = new HydraOAuthFlowProvider(createHydraMock({ getOAuth2LoginRequest }));

    await expect(provider.getLoginRequest("bad")).rejects.toBeInstanceOf(InvalidOAuthRequestError);
  });

  it("throws OAuthProviderUnavailableError when Hydra is down", async () => {
    const getOAuth2LoginRequest = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });

    const provider = new HydraOAuthFlowProvider(createHydraMock({ getOAuth2LoginRequest }));

    await expect(provider.getLoginRequest("challenge")).rejects.toBeInstanceOf(
      OAuthProviderUnavailableError,
    );
  });
});

describe("HydraOAuthFlowProvider.acceptLoginRequest", () => {
  it("accepts a login challenge and rewrites Hydra redirect URLs", async () => {
    const acceptOAuth2LoginRequest = vi.fn().mockResolvedValue({
      data: { redirect_to: "http://127.0.0.1:4444/oauth2/auth?login_verifier=abc" },
    });

    const provider = new HydraOAuthFlowProvider(createHydraMock({ acceptOAuth2LoginRequest }));

    await expect(
      provider.acceptLoginRequest({
        challenge: "login-challenge-1",
        subject: "user-1",
        remember: true,
        rememberFor: 3600,
        identityProviderSessionId: "kratos-session-1",
      }),
    ).resolves.toEqual({
      redirectTo: "https://localhost/api/oauth/authorize?login_verifier=abc",
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

    const provider = new HydraOAuthFlowProvider(createHydraMock({ rejectOAuth2LoginRequest }));

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

    const provider = new HydraOAuthFlowProvider(createHydraMock({ rejectOAuth2LoginRequest }));

    await expect(provider.rejectLoginRequest({ challenge: "missing" })).rejects.toBeInstanceOf(
      OAuthRequestNotFoundError,
    );
  });
});

describe("HydraOAuthFlowProvider.getConsentRequest", () => {
  it("maps a Hydra consent request without exposing Hydra request URLs", async () => {
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

    const provider = new HydraOAuthFlowProvider(createHydraMock({ getOAuth2ConsentRequest }));

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

    const provider = new HydraOAuthFlowProvider(createHydraMock({ acceptOAuth2ConsentRequest }));

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

  it("rewrites Hydra consent verifier redirects to the public authorize URL", async () => {
    const acceptOAuth2ConsentRequest = vi.fn().mockResolvedValue({
      data: { redirect_to: "http://127.0.0.1:4444/oauth2/auth?consent_verifier=abc" },
    });

    const provider = new HydraOAuthFlowProvider(createHydraMock({ acceptOAuth2ConsentRequest }));

    await expect(
      provider.acceptConsentRequest({
        challenge: "consent-challenge-1",
        grantScope: ["openid"],
      }),
    ).resolves.toEqual({
      redirectTo: "https://localhost/api/oauth/authorize?consent_verifier=abc",
    });
  });
});

describe("HydraOAuthFlowProvider.rejectConsentRequest", () => {
  it("rejects a consent challenge and returns the redirect URL", async () => {
    const rejectOAuth2ConsentRequest = vi.fn().mockResolvedValue({
      data: { redirect_to: "http://localhost:3000/callback?error=access_denied" },
    });

    const provider = new HydraOAuthFlowProvider(createHydraMock({ rejectOAuth2ConsentRequest }));

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
});
