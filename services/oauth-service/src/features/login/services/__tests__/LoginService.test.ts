import { describe, expect, it, vi } from "vitest";
import { LoginService } from "@/features/login/services/LoginService";
import type { IOAuthFlowProvider } from "@/integrations/oauth";
import { OAuthRequestNotFoundError } from "@/integrations/oauth/errors";

const createFlowProvider = (overrides: Partial<IOAuthFlowProvider> = {}): IOAuthFlowProvider => ({
  forwardAuthorization: vi.fn(),
  getLoginRequest: vi.fn(),
  acceptLoginRequest: vi.fn(),
  rejectLoginRequest: vi.fn(),
  getConsentRequest: vi.fn(),
  acceptConsentRequest: vi.fn(),
  rejectConsentRequest: vi.fn(),
  ...overrides,
});

describe("LoginService.accept", () => {
  it("accepts a login challenge for an authenticated subject and returns redirectTo", async () => {
    const acceptLoginRequest = vi.fn().mockResolvedValue({
      redirectTo: "https://localhost/api/oauth/authorize?login_verifier=abc",
    });
    const service = new LoginService(createFlowProvider({ acceptLoginRequest }));

    await expect(
      service.accept({
        challenge: "login-challenge-1",
        subject: "user-1",
      }),
    ).resolves.toEqual({
      redirectTo: "https://localhost/api/oauth/authorize?login_verifier=abc",
    });
    expect(acceptLoginRequest).toHaveBeenCalledWith({
      challenge: "login-challenge-1",
      subject: "user-1",
      remember: undefined,
      rememberFor: undefined,
      identityProviderSessionId: undefined,
    });
  });

  it("accepts a login challenge with remember options and identity provider session id", async () => {
    const acceptLoginRequest = vi.fn().mockResolvedValue({
      redirectTo: "https://localhost/api/oauth/authorize?login_verifier=abc",
    });
    const service = new LoginService(createFlowProvider({ acceptLoginRequest }));

    await expect(
      service.accept({
        challenge: "login-challenge-1",
        subject: "user-1",
        remember: true,
        rememberFor: 3600,
        identityProviderSessionId: "kratos-session-1",
      }),
    ).resolves.toEqual({
      redirectTo: "https://localhost/api/oauth/authorize?login_verifier=abc",
    });
    expect(acceptLoginRequest).toHaveBeenCalledWith({
      challenge: "login-challenge-1",
      subject: "user-1",
      remember: true,
      rememberFor: 3600,
      identityProviderSessionId: "kratos-session-1",
    });
  });

  it("propagates OAuthRequestNotFoundError when the login challenge is unknown", async () => {
    const acceptLoginRequest = vi.fn().mockRejectedValue(new OAuthRequestNotFoundError());
    const service = new LoginService(createFlowProvider({ acceptLoginRequest }));

    await expect(
      service.accept({
        challenge: "missing",
        subject: "user-1",
      }),
    ).rejects.toBeInstanceOf(OAuthRequestNotFoundError);
  });
});
