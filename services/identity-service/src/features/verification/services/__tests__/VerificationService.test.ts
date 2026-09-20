import { UserNotFoundError } from "@pine/common";
import { IdentityEmailVerifiedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import {
  IdentityNotFoundError,
  IdentityProviderUnavailableError,
  InvalidCredentialError,
} from "@/integrations/identity";
import { VerificationService } from "../VerificationService";

describe("VerificationService", () => {
  it("verifies email via the identity provider and schedules IdentityEmailVerified in the outbox", async () => {
    const verificationProvider = {
      verifyEmail: vi
        .fn()
        .mockResolvedValue({ id: "idp-1", email: "a@b.com", emailVerified: true }),
    };
    const identityService = {
      getIdByExternalId: vi.fn().mockResolvedValue("identity-1"),
    };
    const identityProfileRepository = {
      findByIdentityId: vi.fn().mockResolvedValue({
        identityId: "identity-1",
        firstName: "Ada",
        middleName: null,
        lastName: "Lovelace",
        photoUrl: "https://example.com/ada.png",
      }),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = new VerificationService(
      verificationProvider as never,
      identityService as never,
      identityProfileRepository as never,
      outboxService as never,
    );

    await expect(
      service.verifyEmail({ flowId: "flow-1", code: "123456" }),
    ).resolves.toBeUndefined();

    expect(verificationProvider.verifyEmail).toHaveBeenCalledWith({
      flowId: "flow-1",
      code: "123456",
    });
    expect(identityService.getIdByExternalId).toHaveBeenCalledWith("idp-1");
    expect(identityProfileRepository.findByIdentityId).toHaveBeenCalledWith("identity-1");
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: IdentityEmailVerifiedEvent.type,
        eventVersion: IdentityEmailVerifiedEvent.version,
        aggregateType: "identity",
        aggregateId: "identity-1",
        payload: expect.objectContaining({
          type: IdentityEmailVerifiedEvent.type,
          source: "pine/identity-service",
          subject: "identity-1",
          data: {
            emailVerificationStatus: "Verified",
            userId: "identity-1",
            displayName: "Ada Lovelace",
            photoUrl: "https://example.com/ada.png",
          },
        }),
      }),
    );
    const scheduled = outboxService.schedule.mock.calls[0][0];
    expect(scheduled.eventId).toEqual(expect.any(String));
    expect(scheduled.payload.id).toEqual(scheduled.eventId);
  });

  it("omits displayName when no profile exists", async () => {
    const verificationProvider = {
      verifyEmail: vi
        .fn()
        .mockResolvedValue({ id: "idp-1", email: "a@b.com", emailVerified: true }),
    };
    const identityService = {
      getIdByExternalId: vi.fn().mockResolvedValue("identity-1"),
    };
    const identityProfileRepository = {
      findByIdentityId: vi.fn().mockResolvedValue(null),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = new VerificationService(
      verificationProvider as never,
      identityService as never,
      identityProfileRepository as never,
      outboxService as never,
    );

    await service.verifyEmail({ flowId: "flow-1", code: "123456" });

    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          data: {
            emailVerificationStatus: "Verified",
            userId: "identity-1",
          },
        }),
      }),
    );
  });

  it("throws UserNotFoundError when the local identity is missing", async () => {
    const verificationProvider = {
      verifyEmail: vi
        .fn()
        .mockResolvedValue({ id: "idp-1", email: "a@b.com", emailVerified: true }),
    };
    const identityService = {
      getIdByExternalId: vi.fn().mockRejectedValue(new UserNotFoundError()),
    };
    const identityProfileRepository = {
      findByIdentityId: vi.fn(),
    };
    const outboxService = {
      schedule: vi.fn(),
    };

    const service = new VerificationService(
      verificationProvider as never,
      identityService as never,
      identityProfileRepository as never,
      outboxService as never,
    );

    await expect(service.verifyEmail({ flowId: "flow-1", code: "123456" })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("propagates identity provider errors and does not schedule", async () => {
    const verificationProvider = {
      verifyEmail: vi.fn().mockRejectedValue(new InvalidCredentialError()),
    };
    const identityService = {
      getIdByExternalId: vi.fn(),
    };
    const identityProfileRepository = {
      findByIdentityId: vi.fn(),
    };
    const outboxService = {
      schedule: vi.fn(),
    };

    const service = new VerificationService(
      verificationProvider as never,
      identityService as never,
      identityProfileRepository as never,
      outboxService as never,
    );

    await expect(service.verifyEmail({ flowId: "flow-1", code: "bad" })).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );
    expect(identityService.getIdByExternalId).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("delegates resend verification email to the identity provider", async () => {
    const verificationProvider = {
      resendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    };

    const service = new VerificationService(
      verificationProvider as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.resendVerificationEmail({ email: "a@b.com" })).resolves.toBeUndefined();

    expect(verificationProvider.resendVerificationEmail).toHaveBeenCalledWith({
      email: "a@b.com",
    });
  });

  it("swallows not-found errors when resending (anti-enumeration)", async () => {
    const verificationProvider = {
      resendVerificationEmail: vi.fn().mockRejectedValue(new IdentityNotFoundError()),
    };

    const service = new VerificationService(
      verificationProvider as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.resendVerificationEmail({ email: "missing@b.com" }),
    ).resolves.toBeUndefined();
  });

  it("propagates provider unavailable errors when resending", async () => {
    const verificationProvider = {
      resendVerificationEmail: vi.fn().mockRejectedValue(new IdentityProviderUnavailableError()),
    };

    const service = new VerificationService(
      verificationProvider as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.resendVerificationEmail({ email: "a@b.com" })).rejects.toBeInstanceOf(
      IdentityProviderUnavailableError,
    );
  });
});
