import { describe, it, expect, vi } from "vitest";
import { IdentityProviderUnavailableError, InvalidCredentialError } from "@/integrations/identity";
import { MeService } from "../MeService";

const identity = {
  id: "identity-1",
  email: "a@b.com",
  emailVerified: true,
};

const profile = {
  id: "profile-1",
  identityId: "identity-1",
  firstName: "Ada",
  middleName: null,
  lastName: "Lovelace",
  gender: null,
  description: null,
  photoUrl: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: null,
  deletedAt: null,
};

describe("MeService", () => {
  it("returns the current user identity and profile", async () => {
    const sessionService = {
      getIdentityFromSessionToken: vi.fn().mockResolvedValue(identity),
    };
    const profileRepository = {
      findByIdentityId: vi.fn().mockResolvedValue(profile),
    };

    const service = new MeService(sessionService as never, profileRepository as never);

    await expect(service.getCurrentUser("session-token-1")).resolves.toEqual({
      identity,
      profile,
    });

    expect(sessionService.getIdentityFromSessionToken).toHaveBeenCalledWith("session-token-1");
    expect(profileRepository.findByIdentityId).toHaveBeenCalledWith("identity-1");
  });

  it("returns a null profile when none exists for the identity", async () => {
    const sessionService = {
      getIdentityFromSessionToken: vi.fn().mockResolvedValue(identity),
    };
    const profileRepository = {
      findByIdentityId: vi.fn().mockResolvedValue(null),
    };

    const service = new MeService(sessionService as never, profileRepository as never);

    await expect(service.getCurrentUser("session-token-1")).resolves.toEqual({
      identity,
      profile: null,
    });
  });

  it("propagates invalid credential errors from the session service", async () => {
    const sessionService = {
      getIdentityFromSessionToken: vi.fn().mockRejectedValue(new InvalidCredentialError()),
    };
    const profileRepository = {
      findByIdentityId: vi.fn(),
    };

    const service = new MeService(sessionService as never, profileRepository as never);

    await expect(service.getCurrentUser("session-token-1")).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );

    expect(sessionService.getIdentityFromSessionToken).toHaveBeenCalledWith("session-token-1");
    expect(profileRepository.findByIdentityId).not.toHaveBeenCalled();
  });

  it("propagates provider unavailable errors from the session service", async () => {
    const sessionService = {
      getIdentityFromSessionToken: vi.fn().mockRejectedValue(new IdentityProviderUnavailableError()),
    };
    const profileRepository = {
      findByIdentityId: vi.fn(),
    };

    const service = new MeService(sessionService as never, profileRepository as never);

    await expect(service.getCurrentUser("session-token-1")).rejects.toBeInstanceOf(
      IdentityProviderUnavailableError,
    );

    expect(sessionService.getIdentityFromSessionToken).toHaveBeenCalledWith("session-token-1");
    expect(profileRepository.findByIdentityId).not.toHaveBeenCalled();
  });
});
