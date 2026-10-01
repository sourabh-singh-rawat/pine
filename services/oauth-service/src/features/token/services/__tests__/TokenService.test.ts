import { describe, expect, it, vi } from "vitest";
import { TokenService } from "@/features/token/services/TokenService";
import type { IOAuthTokenProvider } from "@/integrations/oauth";
import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
} from "@/integrations/oauth/errors";

const createTokenProvider = (
  overrides: Partial<IOAuthTokenProvider> = {},
): IOAuthTokenProvider => ({
  exchangeToken: vi.fn(),
  introspectToken: vi.fn(),
  revokeToken: vi.fn(),
  ...overrides,
});

describe("TokenService.exchange", () => {
  it("exchanges an authorization code via the OAuth token provider", async () => {
    const exchangeToken = vi.fn().mockResolvedValue({
      accessToken: "access-1",
      tokenType: "bearer",
      expiresIn: 3600,
      refreshToken: "refresh-1",
      idToken: "id-1",
      scope: "openid offline",
    });
    const service = new TokenService(createTokenProvider({ exchangeToken }));

    await expect(
      service.exchange({
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
    const service = new TokenService(createTokenProvider({ exchangeToken }));

    await expect(
      service.exchange({
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
    const service = new TokenService(createTokenProvider({ exchangeToken }));

    await expect(
      service.exchange({
        grantType: "authorization_code",
        code: "auth-code-1",
        clientId: "pine-web",
        redirectUri: "http://localhost:3001/callback",
        codeVerifier: "verifier-1",
      }),
    ).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
  });
});

describe("TokenService.introspect", () => {
  it.todo("introspects an access token and returns the mapped result");

  it.todo("introspects an access token with an optional required scope");

  it.todo("returns inactive when the token is expired or revoked");

  it.todo("propagates OAuthProviderUnavailableError when token operations fail");
});
