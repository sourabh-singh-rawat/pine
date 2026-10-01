import { describe, expect, it, vi } from "vitest";
import { ConsentService } from "@/features/consent/services/ConsentService";
import type { IOAuthFlowProvider } from "@/integrations/oauth";
import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
  OAuthRequestNotFoundError,
} from "@/integrations/oauth/errors";

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

describe("ConsentService.getChallenge", () => {
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
    const service = new ConsentService(createFlowProvider({ getConsentRequest }));

    await expect(service.getChallenge("consent-challenge-1")).resolves.toEqual(consentChallenge);
    expect(getConsentRequest).toHaveBeenCalledWith("consent-challenge-1");
  });

  it("propagates OAuthRequestNotFoundError when the consent challenge is unknown", async () => {
    const getConsentRequest = vi.fn().mockRejectedValue(new OAuthRequestNotFoundError());
    const service = new ConsentService(createFlowProvider({ getConsentRequest }));

    await expect(service.getChallenge("missing")).rejects.toBeInstanceOf(OAuthRequestNotFoundError);
  });

  it("propagates InvalidOAuthRequestError when the consent challenge is invalid", async () => {
    const getConsentRequest = vi.fn().mockRejectedValue(new InvalidOAuthRequestError());
    const service = new ConsentService(createFlowProvider({ getConsentRequest }));

    await expect(service.getChallenge("bad")).rejects.toBeInstanceOf(InvalidOAuthRequestError);
  });

  it("propagates OAuthProviderUnavailableError when the OAuth provider is down", async () => {
    const getConsentRequest = vi.fn().mockRejectedValue(new OAuthProviderUnavailableError());
    const service = new ConsentService(createFlowProvider({ getConsentRequest }));

    await expect(service.getChallenge("consent-challenge-1")).rejects.toBeInstanceOf(
      OAuthProviderUnavailableError,
    );
  });
});

describe("ConsentService.accept", () => {
  it("accepts a consent challenge with granted scopes and returns redirectTo", async () => {
    const acceptConsentRequest = vi.fn().mockResolvedValue({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?consent_verifier=abc",
    });
    const service = new ConsentService(createFlowProvider({ acceptConsentRequest }));

    await expect(
      service.accept({
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
    const service = new ConsentService(createFlowProvider({ acceptConsentRequest }));

    await expect(
      service.accept({
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
});

describe("ConsentService.reject", () => {
  it("rejects a consent challenge with an error code and description and returns redirectTo", async () => {
    const rejectConsentRequest = vi.fn().mockResolvedValue({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?error=access_denied",
    });
    const service = new ConsentService(createFlowProvider({ rejectConsentRequest }));

    await expect(
      service.reject({
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
});
