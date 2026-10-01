import { describe, expect, it, vi } from "vitest";
import { AuthorizeService } from "@/features/authorize/services/AuthorizeService";
import type { IOAuthFlowProvider } from "@/integrations/oauth";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

const createFlowProvider = (overrides: Partial<IOAuthFlowProvider> = {}): IOAuthFlowProvider => ({
  getAuthorizationUrl: vi.fn(),
  getLoginRequest: vi.fn(),
  acceptLoginRequest: vi.fn(),
  rejectLoginRequest: vi.fn(),
  getConsentRequest: vi.fn(),
  acceptConsentRequest: vi.fn(),
  rejectConsentRequest: vi.fn(),
  ...overrides,
});

describe("AuthorizeService.authorize", () => {
  it("builds the authorization URL via the OAuth flow provider", async () => {
    const getAuthorizationUrl = vi
      .fn()
      .mockReturnValue("http://127.0.0.1:4444/oauth2/auth?client_id=issues-web");
    const service = new AuthorizeService(createFlowProvider({ getAuthorizationUrl }));

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
    const service = new AuthorizeService(createFlowProvider({ getAuthorizationUrl }));

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
    const service = new AuthorizeService(createFlowProvider({ getAuthorizationUrl }));

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
    const service = new AuthorizeService(createFlowProvider({ getAuthorizationUrl }));

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
