import { UserNotFoundError } from "@pine/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IIdentityService } from "@/features/identities/services/IIdentityService";
import { SessionService } from "@/features/session/services/SessionService";
import type { ISessionProvider, Identity } from "@/integrations/identity";
import { InvalidCredentialError } from "@/integrations/identity";
import type { IOAuthTokenProvider } from "@/integrations/oauth";

describe("SessionService", () => {
  const getSession = vi.fn();
  const introspectToken = vi.fn();
  const getIdByExternalId = vi.fn();
  const getById = vi.fn();
  const sessionProvider = { getSession } as unknown as ISessionProvider;
  const oauthTokenProvider = { introspectToken } as unknown as IOAuthTokenProvider;
  const identityService = {
    getIdByExternalId,
    getById,
  } as unknown as IIdentityService;
  let service: SessionService;

  beforeEach(() => {
    getSession.mockReset();
    introspectToken.mockReset();
    getIdByExternalId.mockReset();
    getById.mockReset();
    service = new SessionService(sessionProvider, oauthTokenProvider, identityService);
  });

  it("returns the local identity id for a Kratos-backed session", async () => {
    const idpIdentity: Identity = {
      id: "idp-1",
      email: "user@example.com",
      emailVerified: true,
    };
    getSession.mockResolvedValue(idpIdentity);
    getIdByExternalId.mockResolvedValue("identity-1");

    await expect(service.getIdentityFromSessionToken("token-1")).resolves.toEqual({
      id: "identity-1",
      email: "user@example.com",
      emailVerified: true,
    });
    expect(getSession).toHaveBeenCalledWith("token-1");
    expect(getIdByExternalId).toHaveBeenCalledWith("idp-1");
  });

  it("throws when no local identity exists for the IdP session", async () => {
    getSession.mockResolvedValue({
      id: "idp-missing",
      email: "missing@example.com",
    });
    getIdByExternalId.mockRejectedValue(new UserNotFoundError());

    await expect(service.getIdentityFromSessionToken("token-1")).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it("returns the local identity from an active OAuth access token", async () => {
    introspectToken.mockResolvedValue({
      active: true,
      subject: "identity-1",
      extra: { email: "oauth@example.com", email_verified: true },
    });
    getById.mockResolvedValue({
      id: "identity-1",
      createdAt: new Date("2026-01-01"),
      updatedAt: null,
    });

    await expect(service.getIdentityFromAccessToken("access-token-1")).resolves.toEqual({
      id: "identity-1",
      email: "oauth@example.com",
      emailVerified: true,
    });
    expect(introspectToken).toHaveBeenCalledWith("access-token-1");
    expect(getById).toHaveBeenCalledWith("identity-1");
  });

  it("returns subject without email when token claims omit it", async () => {
    introspectToken.mockResolvedValue({
      active: true,
      subject: "identity-2",
    });
    getById.mockResolvedValue({
      id: "identity-2",
      createdAt: new Date("2026-01-01"),
      updatedAt: null,
    });

    await expect(service.getIdentityFromAccessToken("access-token-2")).resolves.toEqual({
      id: "identity-2",
      email: "",
      emailVerified: false,
    });
  });

  it("throws when the access token is inactive", async () => {
    introspectToken.mockResolvedValue({ active: false });

    await expect(service.getIdentityFromAccessToken("dead-token")).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );
    expect(getById).not.toHaveBeenCalled();
  });

  it("throws when the access token has no subject", async () => {
    introspectToken.mockResolvedValue({ active: true });

    await expect(service.getIdentityFromAccessToken("no-sub")).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );
    expect(getById).not.toHaveBeenCalled();
  });

  it("throws when the OAuth subject is not a known local identity", async () => {
    introspectToken.mockResolvedValue({
      active: true,
      subject: "unknown-identity",
    });
    getById.mockRejectedValue(new UserNotFoundError());

    await expect(service.getIdentityFromAccessToken("access-token-3")).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});
