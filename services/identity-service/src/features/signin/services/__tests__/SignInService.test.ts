import { UserNotFoundError } from "@pine/common";
import { describe, it, expect, vi } from "vitest";
import { IdentityProviderUnavailableError, InvalidCredentialError } from "@/integrations/identity";
import { SignInService } from "../SignInService";

describe("SignInService", () => {
  const idpSignInResult = {
    identity: { id: "idp-1", email: "a@b.com", emailVerified: true },
    sessionId: "session-1",
    sessionToken: "session-token",
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
  };

  const resolvedSignInResult = {
    ...idpSignInResult,
    identity: {
      id: "identity-1",
      email: "a@b.com",
      emailVerified: true,
    },
  };

  it("signs in and returns the local identity id when no login challenge is provided", async () => {
    const sessionProvider = {
      signIn: vi.fn().mockResolvedValue(idpSignInResult),
    };
    const oauthProvider = {
      acceptLoginRequest: vi.fn(),
    };
    const identityService = {
      getIdByExternalId: vi.fn().mockResolvedValue("identity-1"),
    };

    const service = new SignInService(
      sessionProvider as never,
      oauthProvider as never,
      identityService as never,
    );

    await expect(
      service.signInWithEmailAndPassword({ email: "a@b.com", password: "password" }),
    ).resolves.toEqual(resolvedSignInResult);

    expect(sessionProvider.signIn).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "password",
    });
    expect(identityService.getIdByExternalId).toHaveBeenCalledWith("idp-1");
    expect(oauthProvider.acceptLoginRequest).not.toHaveBeenCalled();
  });

  it("accepts the OAuth login request with the local identity as subject", async () => {
    const sessionProvider = {
      signIn: vi.fn().mockResolvedValue(idpSignInResult),
    };
    const oauthProvider = {
      acceptLoginRequest: vi.fn().mockResolvedValue({
        redirectTo: "http://127.0.0.1:4444/oauth2/auth?login_verifier=abc",
      }),
    };
    const identityService = {
      getIdByExternalId: vi.fn().mockResolvedValue("identity-1"),
    };

    const service = new SignInService(
      sessionProvider as never,
      oauthProvider as never,
      identityService as never,
    );

    await expect(
      service.signInWithEmailAndPassword({
        email: "a@b.com",
        password: "password",
        loginChallenge: "login-challenge-1",
      }),
    ).resolves.toEqual({
      ...resolvedSignInResult,
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?login_verifier=abc",
    });

    expect(oauthProvider.acceptLoginRequest).toHaveBeenCalledWith({
      challenge: "login-challenge-1",
      subject: "identity-1",
      identityProviderSessionId: "session-1",
    });
  });

  it("throws when no local identity exists for the IdP identity", async () => {
    const sessionProvider = {
      signIn: vi.fn().mockResolvedValue(idpSignInResult),
    };
    const oauthProvider = {
      acceptLoginRequest: vi.fn(),
    };
    const identityService = {
      getIdByExternalId: vi.fn().mockRejectedValue(new UserNotFoundError()),
    };

    const service = new SignInService(
      sessionProvider as never,
      oauthProvider as never,
      identityService as never,
    );

    await expect(
      service.signInWithEmailAndPassword({ email: "a@b.com", password: "password" }),
    ).rejects.toBeInstanceOf(UserNotFoundError);

    expect(oauthProvider.acceptLoginRequest).not.toHaveBeenCalled();
  });

  it("propagates invalid credential errors from the session provider", async () => {
    const sessionProvider = {
      signIn: vi.fn().mockRejectedValue(new InvalidCredentialError()),
    };
    const oauthProvider = {
      acceptLoginRequest: vi.fn(),
    };
    const identityService = {
      getIdByExternalId: vi.fn(),
    };

    const service = new SignInService(
      sessionProvider as never,
      oauthProvider as never,
      identityService as never,
    );

    await expect(
      service.signInWithEmailAndPassword({ email: "a@b.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(InvalidCredentialError);

    expect(sessionProvider.signIn).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "wrong",
    });
    expect(identityService.getIdByExternalId).not.toHaveBeenCalled();
    expect(oauthProvider.acceptLoginRequest).not.toHaveBeenCalled();
  });

  it("propagates provider unavailable errors from the session provider", async () => {
    const sessionProvider = {
      signIn: vi.fn().mockRejectedValue(new IdentityProviderUnavailableError()),
    };
    const oauthProvider = {
      acceptLoginRequest: vi.fn(),
    };
    const identityService = {
      getIdByExternalId: vi.fn(),
    };

    const service = new SignInService(
      sessionProvider as never,
      oauthProvider as never,
      identityService as never,
    );

    await expect(
      service.signInWithEmailAndPassword({ email: "a@b.com", password: "password" }),
    ).rejects.toBeInstanceOf(IdentityProviderUnavailableError);

    expect(identityService.getIdByExternalId).not.toHaveBeenCalled();
    expect(oauthProvider.acceptLoginRequest).not.toHaveBeenCalled();
  });
});
