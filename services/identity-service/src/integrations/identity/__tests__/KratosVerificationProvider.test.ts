import { describe, it, expect, vi } from "vitest";
import {
  IdentityNotFoundError,
  IdentityProviderUnavailableError,
  InvalidCredentialError,
} from "@/integrations/identity/errors";
import { createKratosMock } from "@/integrations/identity/createKratosMock";
import { KratosErrorMapper } from "@/integrations/identity/KratosErrorMapper";
import { KratosVerificationProvider } from "@/integrations/identity/KratosVerificationProvider";

function createProvider(overrides?: Parameters<typeof createKratosMock>[0]) {
  return new KratosVerificationProvider(
    createKratosMock(overrides) as never,
    new KratosErrorMapper(),
  );
}

describe("KratosVerificationProvider.verifyEmail", () => {
  const emailNode = {
    attributes: {
      node_type: "input",
      name: "email",
      value: "a@b.com",
    },
  };

  it("submits the verification code and returns the verified identity", async () => {
    const getVerificationFlow = vi.fn().mockResolvedValue({
      data: {
        id: "flow-1",
        state: "sent_email",
        ui: { nodes: [emailNode] },
      },
    });
    const updateVerificationFlow = vi.fn().mockResolvedValue({
      data: {
        id: "flow-1",
        state: "passed_challenge",
        ui: { nodes: [] },
      },
    });
    const listIdentities = vi.fn().mockResolvedValue({
      data: [
        {
          id: "idp-1",
          traits: { email: "a@b.com" },
          verifiable_addresses: [{ value: "a@b.com", verified: true }],
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-02T00:00:00.000Z",
        },
      ],
    });

    const provider = createProvider({
      getVerificationFlow,
      updateVerificationFlow,
      listIdentities,
    });

    await expect(provider.verifyEmail({ flowId: "flow-1", code: "123456" })).resolves.toEqual({
      id: "idp-1",
      email: "a@b.com",
      emailVerified: true,
      traits: { email: "a@b.com" },
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    });

    expect(getVerificationFlow).toHaveBeenCalledWith({ id: "flow-1" });
    expect(updateVerificationFlow).toHaveBeenCalledWith({
      flow: "flow-1",
      updateVerificationFlowBody: {
        method: "code",
        code: "123456",
      },
    });
    expect(listIdentities).toHaveBeenCalledWith({
      credentialsIdentifier: "a@b.com",
      pageSize: 1,
    });
  });

  it("throws InvalidCredentialError when verification did not pass", async () => {
    const getVerificationFlow = vi.fn().mockResolvedValue({
      data: { id: "flow-1", state: "sent_email", ui: { nodes: [emailNode] } },
    });
    const updateVerificationFlow = vi.fn().mockResolvedValue({
      data: { id: "flow-1", state: "sent_email" },
    });

    const provider = createProvider({ getVerificationFlow, updateVerificationFlow });

    await expect(provider.verifyEmail({ flowId: "flow-1", code: "bad" })).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );
  });

  it("throws InvalidCredentialError when Kratos returns 400", async () => {
    const getVerificationFlow = vi.fn().mockResolvedValue({
      data: { id: "flow-1", state: "sent_email", ui: { nodes: [emailNode] } },
    });
    const updateVerificationFlow = vi.fn().mockRejectedValue({
      response: { status: 400 },
    });

    const provider = createProvider({ getVerificationFlow, updateVerificationFlow });

    await expect(provider.verifyEmail({ flowId: "flow-1", code: "bad" })).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );
  });

  it("throws IdentityProviderUnavailableError when Kratos is down", async () => {
    const getVerificationFlow = vi.fn().mockResolvedValue({
      data: { id: "flow-1", state: "sent_email", ui: { nodes: [emailNode] } },
    });
    const updateVerificationFlow = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });

    const provider = createProvider({ getVerificationFlow, updateVerificationFlow });

    await expect(provider.verifyEmail({ flowId: "flow-1", code: "123456" })).rejects.toBeInstanceOf(
      IdentityProviderUnavailableError,
    );
  });

  it("throws IdentityNotFoundError when the verified identity cannot be listed", async () => {
    const getVerificationFlow = vi.fn().mockResolvedValue({
      data: { id: "flow-1", state: "sent_email", ui: { nodes: [emailNode] } },
    });
    const updateVerificationFlow = vi.fn().mockResolvedValue({
      data: { id: "flow-1", state: "passed_challenge", ui: { nodes: [] } },
    });
    const listIdentities = vi.fn().mockResolvedValue({ data: [] });

    const provider = createProvider({
      getVerificationFlow,
      updateVerificationFlow,
      listIdentities,
    });

    await expect(provider.verifyEmail({ flowId: "flow-1", code: "123456" })).rejects.toBeInstanceOf(
      IdentityNotFoundError,
    );
  });
});

describe("KratosVerificationProvider.resendVerificationEmail", () => {
  it("creates a verification flow and submits the email to resend the code", async () => {
    const createNativeVerificationFlow = vi.fn().mockResolvedValue({
      data: {
        id: "verify-flow-1",
        state: "choose_method",
      },
    });
    const updateVerificationFlow = vi.fn().mockResolvedValue({
      data: {
        id: "verify-flow-1",
        state: "sent_email",
      },
    });

    const provider = createProvider({ createNativeVerificationFlow, updateVerificationFlow });

    await expect(provider.resendVerificationEmail({ email: "a@b.com" })).resolves.toBeUndefined();

    expect(createNativeVerificationFlow).toHaveBeenCalled();
    expect(updateVerificationFlow).toHaveBeenCalledWith({
      flow: "verify-flow-1",
      updateVerificationFlowBody: {
        method: "code",
        email: "a@b.com",
      },
    });
  });

  it("throws IdentityProviderUnavailableError when Kratos is down", async () => {
    const createNativeVerificationFlow = vi.fn().mockRejectedValue({
      response: { status: 503 },
    });

    const provider = createProvider({ createNativeVerificationFlow });

    await expect(provider.resendVerificationEmail({ email: "a@b.com" })).rejects.toBeInstanceOf(
      IdentityProviderUnavailableError,
    );
  });
});
