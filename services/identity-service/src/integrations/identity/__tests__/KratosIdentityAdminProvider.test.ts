import { describe, it, expect, vi } from "vitest";
import {
  IdentityAlreadyExistsError,
  IdentityNotFoundError,
  IdentityProviderUnavailableError,
} from "@/integrations/identity/errors";
import { createKratosMock } from "@/integrations/identity/createKratosMock";
import { KratosErrorMapper } from "@/integrations/identity/KratosErrorMapper";
import { KratosIdentityAdminProvider } from "@/integrations/identity/KratosIdentityAdminProvider";

function createProvider(overrides?: Parameters<typeof createKratosMock>[0]) {
  return new KratosIdentityAdminProvider(
    createKratosMock(overrides) as never,
    new KratosErrorMapper(),
  );
}

describe("KratosIdentityAdminProvider.deleteIdentity", () => {
  it("deletes the identity via the Kratos admin API", async () => {
    const deleteIdentity = vi.fn().mockResolvedValue(undefined);
    const provider = createProvider({ deleteIdentity });

    await expect(provider.deleteIdentity("identity-1")).resolves.toBeUndefined();

    expect(deleteIdentity).toHaveBeenCalledWith({ id: "identity-1" });
  });

  it("throws IdentityNotFoundError when Kratos returns 404", async () => {
    const deleteIdentity = vi.fn().mockRejectedValue({
      response: { status: 404 },
    });
    const provider = createProvider({ deleteIdentity });

    await expect(provider.deleteIdentity("missing")).rejects.toBeInstanceOf(IdentityNotFoundError);
  });

  it("throws IdentityProviderUnavailableError when Kratos is down", async () => {
    const deleteIdentity = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });
    const provider = createProvider({ deleteIdentity });

    await expect(provider.deleteIdentity("identity-1")).rejects.toBeInstanceOf(
      IdentityProviderUnavailableError,
    );
  });
});

describe("KratosIdentityAdminProvider.existsByEmail", () => {
  it("returns true when Kratos lists a matching identity", async () => {
    const listIdentities = vi.fn().mockResolvedValue({
      data: [{ id: "idp-1" }],
    });
    const provider = createProvider({ listIdentities });

    await expect(provider.existsByEmail("a@b.com")).resolves.toBe(true);
    expect(listIdentities).toHaveBeenCalledWith({
      credentialsIdentifier: "a@b.com",
      pageSize: 1,
    });
  });

  it("returns false when no identity matches", async () => {
    const listIdentities = vi.fn().mockResolvedValue({ data: [] });
    const provider = createProvider({ listIdentities });

    await expect(provider.existsByEmail("missing@b.com")).resolves.toBe(false);
  });
});

describe("KratosIdentityAdminProvider.findIdpIdByEmail", () => {
  it("returns the Kratos identity id when a match exists", async () => {
    const listIdentities = vi.fn().mockResolvedValue({
      data: [{ id: "idp-1" }],
    });
    const provider = createProvider({ listIdentities });

    await expect(provider.findIdpIdByEmail("a@b.com")).resolves.toBe("idp-1");
  });

  it("returns null when no identity matches", async () => {
    const listIdentities = vi.fn().mockResolvedValue({ data: [] });
    const provider = createProvider({ listIdentities });

    await expect(provider.findIdpIdByEmail("missing@b.com")).resolves.toBe(null);
  });
});

describe("KratosIdentityAdminProvider.createIdentity", () => {
  it("creates the identity via the Kratos admin API with a verified email", async () => {
    const createIdentity = vi.fn().mockResolvedValue({
      data: {
        id: "idp-1",
        traits: { email: "admin@pine.local", username: "admin" },
        verifiable_addresses: [
          { value: "admin@pine.local", verified: true, via: "email", status: "completed" },
        ],
      },
    });
    const provider = createProvider({ createIdentity });

    const result = await provider.createIdentity({
      email: "admin@pine.local",
      username: "admin",
      password: "secret",
      emailVerified: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: "idp-1",
        email: "admin@pine.local",
        emailVerified: true,
      }),
    );
    expect(createIdentity).toHaveBeenCalledWith({
      createIdentityBody: {
        schema_id: "user",
        traits: { email: "admin@pine.local", username: "admin" },
        state: "active",
        verifiable_addresses: [
          {
            value: "admin@pine.local",
            via: "email",
            verified: true,
            status: "completed",
          },
        ],
        credentials: {
          password: {
            config: {
              password: "secret",
            },
          },
        },
      },
    });
  });

  it("marks the email as pending when emailVerified is false", async () => {
    const createIdentity = vi.fn().mockResolvedValue({
      data: {
        id: "idp-1",
        traits: { email: "user@pine.local", username: "user" },
        verifiable_addresses: [
          { value: "user@pine.local", verified: false, via: "email", status: "pending" },
        ],
      },
    });
    const provider = createProvider({ createIdentity });

    const result = await provider.createIdentity({
      email: "user@pine.local",
      username: "user",
      password: "secret",
      emailVerified: false,
    });

    expect(result.emailVerified).toBe(false);
    expect(createIdentity).toHaveBeenCalledWith({
      createIdentityBody: expect.objectContaining({
        verifiable_addresses: [
          {
            value: "user@pine.local",
            via: "email",
            verified: false,
            status: "pending",
          },
        ],
      }),
    });
  });

  it("uses schemaId when provided", async () => {
    const createIdentity = vi.fn().mockResolvedValue({
      data: {
        id: "idp-1",
        traits: { email: "admin@pine.local", username: "admin" },
      },
    });
    const provider = createProvider({ createIdentity });

    await provider.createIdentity({
      email: "admin@pine.local",
      username: "admin",
      password: "secret",
      emailVerified: true,
      schemaId: "admin",
    });

    expect(createIdentity).toHaveBeenCalledWith({
      createIdentityBody: expect.objectContaining({
        schema_id: "admin",
      }),
    });
  });

  it("throws IdentityAlreadyExistsError when Kratos reports a conflict", async () => {
    const createIdentity = vi.fn().mockRejectedValue({
      response: { status: 409 },
    });
    const provider = createProvider({ createIdentity });

    await expect(
      provider.createIdentity({
        email: "admin@pine.local",
        username: "admin",
        password: "secret",
        emailVerified: true,
      }),
    ).rejects.toBeInstanceOf(IdentityAlreadyExistsError);
  });

  it("throws IdentityProviderUnavailableError when Kratos is down", async () => {
    const createIdentity = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });
    const provider = createProvider({ createIdentity });

    await expect(
      provider.createIdentity({
        email: "admin@pine.local",
        username: "admin",
        password: "secret",
        emailVerified: true,
      }),
    ).rejects.toBeInstanceOf(IdentityProviderUnavailableError);
  });
});
