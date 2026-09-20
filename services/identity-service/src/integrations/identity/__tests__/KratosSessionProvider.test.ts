import { describe, it, expect, vi } from "vitest";
import {
  IdentityProviderUnavailableError,
  InvalidCredentialError,
} from "@/integrations/identity/errors";
import { createKratosMock } from "@/integrations/identity/createKratosMock";
import { KratosErrorMapper } from "@/integrations/identity/KratosErrorMapper";
import { KratosSessionProvider } from "@/integrations/identity/KratosSessionProvider";

function createProvider(overrides?: Parameters<typeof createKratosMock>[0]) {
  return new KratosSessionProvider(createKratosMock(overrides) as never, new KratosErrorMapper());
}

describe("KratosSessionProvider.signIn", () => {
  it("signs in with email and password via the native Kratos login flow", async () => {
    const expiresAt = "2030-01-01T00:00:00.000Z";
    const updateLoginFlow = vi.fn().mockResolvedValue({
      data: {
        session_token: "session-token-1",
        session: {
          id: "session-1",
          expires_at: expiresAt,
          identity: {
            id: "identity-1",
            traits: { email: "a@b.com" },
            verifiable_addresses: [{ value: "a@b.com", verified: true }],
          },
        },
      },
    });

    const provider = createProvider({ updateLoginFlow });

    await expect(provider.signIn({ email: "a@b.com", password: "password" })).resolves.toEqual({
      identity: {
        id: "identity-1",
        email: "a@b.com",
        emailVerified: true,
      },
      sessionToken: "session-token-1",
      sessionId: "session-1",
      expiresAt: new Date(expiresAt),
    });

    expect(updateLoginFlow).toHaveBeenCalledWith({
      flow: "flow-1",
      updateLoginFlowBody: {
        method: "password",
        identifier: "a@b.com",
        password: "password",
      },
    });
  });

  it("throws InvalidCredentialError when Kratos returns 400", async () => {
    const updateLoginFlow = vi.fn().mockRejectedValue({
      response: { status: 400 },
    });

    const provider = createProvider({ updateLoginFlow });

    await expect(provider.signIn({ email: "a@b.com", password: "wrong" })).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );
  });

  it("throws InvalidCredentialError when Kratos returns 401", async () => {
    const updateLoginFlow = vi.fn().mockRejectedValue({
      response: { status: 401 },
    });

    const provider = createProvider({ updateLoginFlow });

    await expect(provider.signIn({ email: "a@b.com", password: "wrong" })).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );
  });

  it("throws IdentityProviderUnavailableError when Kratos is down", async () => {
    const createNativeLoginFlow = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });

    const provider = createProvider({ createNativeLoginFlow });

    await expect(
      provider.signIn({ email: "a@b.com", password: "password" }),
    ).rejects.toBeInstanceOf(IdentityProviderUnavailableError);
  });

  it("throws IdentityProviderUnavailableError when the session has no identity", async () => {
    const updateLoginFlow = vi.fn().mockResolvedValue({
      data: {
        session_token: "session-token-1",
        session: {
          id: "session-1",
          expires_at: "2030-01-01T00:00:00.000Z",
        },
      },
    });

    const provider = createProvider({ updateLoginFlow });

    await expect(
      provider.signIn({ email: "a@b.com", password: "password" }),
    ).rejects.toBeInstanceOf(IdentityProviderUnavailableError);
  });

  it("throws IdentityProviderUnavailableError when the session token is missing", async () => {
    const updateLoginFlow = vi.fn().mockResolvedValue({
      data: {
        session: {
          id: "session-1",
          expires_at: "2030-01-01T00:00:00.000Z",
          identity: {
            id: "identity-1",
            traits: { email: "a@b.com" },
          },
        },
      },
    });

    const provider = createProvider({ updateLoginFlow });

    await expect(
      provider.signIn({ email: "a@b.com", password: "password" }),
    ).rejects.toBeInstanceOf(IdentityProviderUnavailableError);
  });

  it("throws IdentityProviderUnavailableError when the session expiry is missing", async () => {
    const updateLoginFlow = vi.fn().mockResolvedValue({
      data: {
        session_token: "session-token-1",
        session: {
          id: "session-1",
          identity: {
            id: "identity-1",
            traits: { email: "a@b.com" },
          },
        },
      },
    });

    const provider = createProvider({ updateLoginFlow });

    await expect(
      provider.signIn({ email: "a@b.com", password: "password" }),
    ).rejects.toBeInstanceOf(IdentityProviderUnavailableError);
  });

  it("always returns a sessionToken and expiresAt on successful sign-in", async () => {
    const expiresAt = "2030-01-01T00:00:00.000Z";
    const updateLoginFlow = vi.fn().mockResolvedValue({
      data: {
        session_token: "session-token-1",
        session: {
          id: "session-1",
          expires_at: expiresAt,
          identity: {
            id: "identity-1",
            traits: { email: "a@b.com" },
          },
        },
      },
    });

    const provider = createProvider({ updateLoginFlow });
    const result = await provider.signIn({ email: "a@b.com", password: "password" });

    expect(result.sessionToken).toBe("session-token-1");
    expect(result.expiresAt).toEqual(new Date(expiresAt));
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});

describe("KratosSessionProvider.logout", () => {
  it("logs out via the native Kratos logout API with the session token", async () => {
    const performNativeLogout = vi.fn().mockResolvedValue(undefined);
    const provider = createProvider({ performNativeLogout });

    await expect(provider.logout("session-token-1")).resolves.toBeUndefined();

    expect(performNativeLogout).toHaveBeenCalledWith({
      performNativeLogoutBody: {
        session_token: "session-token-1",
      },
    });
  });

  it("throws InvalidCredentialError when Kratos returns 401", async () => {
    const performNativeLogout = vi.fn().mockRejectedValue({
      response: { status: 401 },
    });
    const provider = createProvider({ performNativeLogout });

    await expect(provider.logout("session-token-1")).rejects.toBeInstanceOf(InvalidCredentialError);
  });

  it("throws InvalidCredentialError when Kratos returns 403", async () => {
    const performNativeLogout = vi.fn().mockRejectedValue({
      response: { status: 403 },
    });
    const provider = createProvider({ performNativeLogout });

    await expect(provider.logout("session-token-1")).rejects.toBeInstanceOf(InvalidCredentialError);
  });

  it("throws IdentityProviderUnavailableError when Kratos is down", async () => {
    const performNativeLogout = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });
    const provider = createProvider({ performNativeLogout });

    await expect(provider.logout("session-token-1")).rejects.toBeInstanceOf(
      IdentityProviderUnavailableError,
    );
  });
});

describe("KratosSessionProvider.getSession", () => {
  it("returns the authenticated identity for a valid session token", async () => {
    const toSession = vi.fn().mockResolvedValue({
      data: {
        id: "session-1",
        identity: {
          id: "identity-1",
          traits: { email: "a@b.com" },
          verifiable_addresses: [{ value: "a@b.com", verified: true }],
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-06-01T00:00:00.000Z",
        },
      },
    });

    const provider = createProvider({ toSession });

    await expect(provider.getSession("session-token-1")).resolves.toEqual({
      id: "identity-1",
      email: "a@b.com",
      emailVerified: true,
      traits: { email: "a@b.com" },
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-06-01T00:00:00.000Z"),
    });

    expect(toSession).toHaveBeenCalledWith({
      xSessionToken: "session-token-1",
    });
  });

  it("throws InvalidCredentialError when the session has no identity", async () => {
    const toSession = vi.fn().mockResolvedValue({
      data: {
        id: "session-1",
      },
    });

    const provider = createProvider({ toSession });

    await expect(provider.getSession("session-token-1")).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );
  });

  it("throws InvalidCredentialError when Kratos returns 401", async () => {
    const toSession = vi.fn().mockRejectedValue({
      response: { status: 401 },
    });

    const provider = createProvider({ toSession });

    await expect(provider.getSession("session-token-1")).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );
  });

  it("throws IdentityProviderUnavailableError when Kratos is down", async () => {
    const toSession = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });

    const provider = createProvider({ toSession });

    await expect(provider.getSession("session-token-1")).rejects.toBeInstanceOf(
      IdentityProviderUnavailableError,
    );
  });
});
