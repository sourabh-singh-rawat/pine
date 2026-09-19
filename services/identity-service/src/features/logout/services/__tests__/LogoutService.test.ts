import { describe, it, expect, vi } from "vitest";
import { IdentityProviderUnavailableError, InvalidCredentialError } from "@/integrations/identity";
import { LogoutService } from "../LogoutService";

describe("LogoutService", () => {
  it("logs out with the session provider using the session token", async () => {
    const sessionProvider = {
      logout: vi.fn().mockResolvedValue(undefined),
    };

    const service = new LogoutService(sessionProvider as never);

    await expect(service.logout("session-token-1")).resolves.toBeUndefined();

    expect(sessionProvider.logout).toHaveBeenCalledWith("session-token-1");
  });

  it("propagates invalid credential errors from the session provider", async () => {
    const sessionProvider = {
      logout: vi.fn().mockRejectedValue(new InvalidCredentialError()),
    };

    const service = new LogoutService(sessionProvider as never);

    await expect(service.logout("session-token-1")).rejects.toBeInstanceOf(InvalidCredentialError);

    expect(sessionProvider.logout).toHaveBeenCalledWith("session-token-1");
  });

  it("propagates provider unavailable errors from the session provider", async () => {
    const sessionProvider = {
      logout: vi.fn().mockRejectedValue(new IdentityProviderUnavailableError()),
    };

    const service = new LogoutService(sessionProvider as never);

    await expect(service.logout("session-token-1")).rejects.toBeInstanceOf(
      IdentityProviderUnavailableError,
    );

    expect(sessionProvider.logout).toHaveBeenCalledWith("session-token-1");
  });
});
