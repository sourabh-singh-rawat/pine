import { describe, it, expect, vi } from "vitest";
import {
  IdentityAlreadyExistsError,
  IdentityProviderUnavailableError,
  InvalidCredentialError,
} from "@/integrations/identity/errors";
import { createKratosMock } from "@/integrations/identity/createKratosMock";
import { KratosErrorMapper } from "@/integrations/identity/KratosErrorMapper";
import { KratosRegistrationProvider } from "@/integrations/identity/KratosRegistrationProvider";

function createProvider(overrides?: Parameters<typeof createKratosMock>[0]) {
  return new KratosRegistrationProvider(
    createKratosMock(overrides) as never,
    new KratosErrorMapper(),
  );
}

describe("KratosRegistrationProvider.register", () => {
  it("registers with email and password via the native Kratos registration flow", async () => {
    const updateRegistrationFlow = vi.fn().mockResolvedValue({
      data: {
        identity: {
          id: "identity-1",
          traits: { email: "a@b.com" },
          verifiable_addresses: [{ value: "a@b.com", verified: false }],
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      },
    });

    const provider = createProvider({ updateRegistrationFlow });

    await expect(
      provider.register({ email: "a@b.com", username: "ada", password: "password" }),
    ).resolves.toEqual({
      id: "identity-1",
      email: "a@b.com",
      emailVerified: false,
      traits: { email: "a@b.com" },
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    expect(updateRegistrationFlow).toHaveBeenCalledWith({
      flow: "reg-flow-1",
      updateRegistrationFlowBody: {
        method: "password",
        password: "password",
        traits: { email: "a@b.com", username: "ada" },
      },
    });
  });

  it("passes identitySchema when schemaId is provided", async () => {
    const createNativeRegistrationFlow = vi.fn().mockResolvedValue({ data: { id: "reg-flow-1" } });
    const updateRegistrationFlow = vi.fn().mockResolvedValue({
      data: {
        identity: {
          id: "identity-1",
          traits: { email: "a@b.com" },
        },
      },
    });

    const provider = createProvider({ createNativeRegistrationFlow, updateRegistrationFlow });

    await provider.register({
      email: "a@b.com",
      username: "ada",
      password: "password",
      schemaId: "user",
      traits: { name: { first: "Ada" } },
    });

    expect(createNativeRegistrationFlow).toHaveBeenCalledWith({
      identitySchema: "user",
    });
    expect(updateRegistrationFlow).toHaveBeenCalledWith({
      flow: "reg-flow-1",
      updateRegistrationFlowBody: {
        method: "password",
        password: "password",
        traits: { name: { first: "Ada" }, email: "a@b.com", username: "ada" },
      },
    });
  });

  it("throws IdentityAlreadyExistsError when Kratos reports a duplicate identifier", async () => {
    const updateRegistrationFlow = vi.fn().mockRejectedValue({
      response: {
        status: 400,
        data: {
          ui: {
            messages: [
              {
                id: 4000007,
                text: "An account with the same identifier already exists.",
                type: "error",
              },
            ],
          },
        },
      },
    });

    const provider = createProvider({ updateRegistrationFlow });

    await expect(
      provider.register({ email: "a@b.com", username: "ada", password: "password" }),
    ).rejects.toBeInstanceOf(IdentityAlreadyExistsError);
  });

  it("throws InvalidCredentialError when Kratos returns a generic 400", async () => {
    const updateRegistrationFlow = vi.fn().mockRejectedValue({
      response: {
        status: 400,
        data: {
          ui: {
            messages: [{ id: 4000005, text: "The password can not be used.", type: "error" }],
          },
        },
      },
    });

    const provider = createProvider({ updateRegistrationFlow });

    await expect(
      provider.register({ email: "a@b.com", username: "ada", password: "weak" }),
    ).rejects.toBeInstanceOf(InvalidCredentialError);
  });

  it("throws IdentityProviderUnavailableError when the identity is missing", async () => {
    const updateRegistrationFlow = vi.fn().mockResolvedValue({
      data: {},
    });

    const provider = createProvider({ updateRegistrationFlow });

    await expect(
      provider.register({ email: "a@b.com", username: "ada", password: "password" }),
    ).rejects.toBeInstanceOf(IdentityProviderUnavailableError);
  });

  it("throws IdentityProviderUnavailableError when Kratos is down", async () => {
    const createNativeRegistrationFlow = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });

    const provider = createProvider({ createNativeRegistrationFlow });

    await expect(
      provider.register({ email: "a@b.com", username: "ada", password: "password" }),
    ).rejects.toBeInstanceOf(IdentityProviderUnavailableError);
  });
});
