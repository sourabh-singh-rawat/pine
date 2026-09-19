import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
} from "@/integrations/oauth/errors";
import { HydraOAuthTokenProvider } from "@/integrations/oauth/HydraOAuthTokenProvider";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

const axiosPost = vi.mocked(axios.post);

function createHydraMock(overrides?: {
  introspectOAuth2Token?: ReturnType<typeof vi.fn>;
  revokeOAuth2Token?: ReturnType<typeof vi.fn>;
}) {
  return {
    publicUrl: "http://127.0.0.1:4444",
    adminApi: {
      introspectOAuth2Token: overrides?.introspectOAuth2Token ?? vi.fn(),
    },
    publicApi: {
      revokeOAuth2Token: overrides?.revokeOAuth2Token ?? vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("HydraOAuthTokenProvider.exchangeToken", () => {
  beforeEach(() => {
    axiosPost.mockReset();
  });

  it("posts an authorization_code grant to Hydra and maps the token response", async () => {
    axiosPost.mockResolvedValue({
      data: {
        access_token: "access-1",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "refresh-1",
        id_token: "id-1",
        scope: "openid offline",
      },
    });

    const provider = new HydraOAuthTokenProvider(createHydraMock() as never);

    await expect(
      provider.exchangeToken({
        grantType: "authorization_code",
        clientId: "issues-web",
        code: "auth-code-1",
        redirectUri: "http://localhost:3000/callback",
        codeVerifier: "verifier",
      }),
    ).resolves.toEqual({
      accessToken: "access-1",
      tokenType: "bearer",
      expiresIn: 3600,
      refreshToken: "refresh-1",
      idToken: "id-1",
      scope: "openid offline",
    });

    expect(axiosPost).toHaveBeenCalledTimes(1);
    const [url, body, options] = axiosPost.mock.calls[0]!;
    expect(url).toBe("http://127.0.0.1:4444/oauth2/token");
    expect(body).toBe(
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: "issues-web",
        code: "auth-code-1",
        redirect_uri: "http://localhost:3000/callback",
        code_verifier: "verifier",
      }).toString(),
    );
    expect(options).toMatchObject({
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  });

  it("includes client_secret when provided", async () => {
    axiosPost.mockResolvedValue({
      data: {
        access_token: "access-1",
        token_type: "bearer",
      },
    });

    const provider = new HydraOAuthTokenProvider(createHydraMock() as never);

    await provider.exchangeToken({
      grantType: "authorization_code",
      clientId: "confidential-client",
      code: "auth-code-1",
      redirectUri: "http://localhost:3000/callback",
      codeVerifier: "verifier",
      clientSecret: "super-secret",
    });

    const body = axiosPost.mock.calls[0]![1] as string;
    expect(body).toContain("client_secret=super-secret");
  });

  it("throws InvalidOAuthRequestError when Hydra returns 400", async () => {
    axiosPost.mockRejectedValue({ response: { status: 400 } });
    const provider = new HydraOAuthTokenProvider(createHydraMock() as never);

    await expect(
      provider.exchangeToken({
        grantType: "authorization_code",
        clientId: "issues-web",
        code: "bad-code",
        redirectUri: "http://localhost:3000/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
  });

  it("throws OAuthProviderUnavailableError when Hydra is down", async () => {
    axiosPost.mockRejectedValue({ response: { status: 503 } });
    const provider = new HydraOAuthTokenProvider(createHydraMock() as never);

    await expect(
      provider.exchangeToken({
        grantType: "authorization_code",
        clientId: "issues-web",
        code: "auth-code-1",
        redirectUri: "http://localhost:3000/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
  });
});

describe("HydraOAuthTokenProvider.introspectToken", () => {
  it("maps introspection results to the domain shape", async () => {
    const introspectOAuth2Token = vi.fn().mockResolvedValue({
      data: {
        active: true,
        sub: "user-1",
        client_id: "issues-web",
        scope: "openid offline",
        exp: 1_893_456_000,
        iat: 1_704_067_200,
        aud: ["api"],
        ext: { role: "user" },
      },
    });

    const provider = new HydraOAuthTokenProvider(
      createHydraMock({ introspectOAuth2Token }) as never,
    );

    await expect(provider.introspectToken("access-token", "openid")).resolves.toEqual({
      active: true,
      subject: "user-1",
      clientId: "issues-web",
      scope: "openid offline",
      expiresAt: new Date(1_893_456_000 * 1000),
      issuedAt: new Date(1_704_067_200 * 1000),
      audience: ["api"],
      extra: { role: "user" },
    });

    expect(introspectOAuth2Token).toHaveBeenCalledWith({
      token: "access-token",
      scope: "openid",
    });
  });
});

describe("HydraOAuthTokenProvider.revokeToken", () => {
  it("revokes a token via the public Hydra API", async () => {
    const revokeOAuth2Token = vi.fn().mockResolvedValue(undefined);
    const provider = new HydraOAuthTokenProvider(createHydraMock({ revokeOAuth2Token }) as never);

    await expect(provider.revokeToken("access-token")).resolves.toBeUndefined();
    expect(revokeOAuth2Token).toHaveBeenCalledWith({ token: "access-token" });
  });
});
