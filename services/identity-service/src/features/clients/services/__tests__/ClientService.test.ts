import { describe, expect, it, vi } from "vitest";
import { ClientService } from "../ClientService";

function createService(oauthProvider: unknown) {
  return new ClientService(oauthProvider as never);
}

describe("ClientService.createClient", () => {
  it("registers the client with the OAuth provider and maps the response", async () => {
    const registerClient = vi.fn().mockResolvedValue({
      clientId: "client-1",
      name: "identity-web",
      redirectUris: ["http://localhost:3000/callback"],
      scopes: ["openid", "profile"],
      grantTypes: ["authorization_code"],
    });
    const service = createService({ registerClient });

    await expect(
      service.createClient({
        name: "identity-web",
        redirectUris: ["http://localhost:3000/callback"],
        scopes: ["openid", "profile"],
        grantTypes: ["authorization_code"],
      }),
    ).resolves.toEqual({
      id: "client-1",
      name: "identity-web",
      redirectUris: ["http://localhost:3000/callback"],
      scopes: ["openid", "profile"],
      grantTypes: ["authorization_code"],
    });

    expect(registerClient).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "identity-web",
        redirectUris: ["http://localhost:3000/callback"],
        scopes: ["openid", "profile"],
        grantTypes: ["authorization_code"],
        clientId: expect.any(String),
      }),
    );
  });
});

describe("ClientService.getClientById", () => {
  it("returns null when the OAuth provider has no client", async () => {
    const getClient = vi.fn().mockResolvedValue(null);
    const service = createService({ getClient });

    await expect(service.getClientById("missing")).resolves.toBeNull();
    expect(getClient).toHaveBeenCalledWith("missing");
  });

  it("returns client details from the OAuth provider", async () => {
    const getClient = vi.fn().mockResolvedValue({
      clientId: "client-1",
      name: "pine-web",
      redirectUris: ["http://localhost/callback", "http://localhost/silent"],
      scopes: ["openid", "profile"],
      grantTypes: ["authorization_code"],
    });
    const service = createService({ getClient });

    await expect(service.getClientById("client-1")).resolves.toEqual({
      id: "client-1",
      name: "pine-web",
      redirectUris: ["http://localhost/callback", "http://localhost/silent"],
      scopes: ["openid", "profile"],
      grantTypes: ["authorization_code"],
    });
    expect(getClient).toHaveBeenCalledWith("client-1");
  });
});

describe("ClientService.deleteClientById", () => {
  it("throws when the client does not exist", async () => {
    const getClient = vi.fn().mockResolvedValue(null);
    const deleteClient = vi.fn();
    const service = createService({ getClient, deleteClient });

    await expect(service.deleteClientById("missing")).rejects.toThrow("Client not found: missing");
    expect(getClient).toHaveBeenCalledWith("missing");
    expect(deleteClient).not.toHaveBeenCalled();
  });

  it("deletes the client via the OAuth provider", async () => {
    const getClient = vi.fn().mockResolvedValue({
      clientId: "client-1",
      name: "pine-web",
    });
    const deleteClient = vi.fn().mockResolvedValue(undefined);
    const service = createService({ getClient, deleteClient });

    await expect(service.deleteClientById("client-1")).resolves.toBeUndefined();
    expect(getClient).toHaveBeenCalledWith("client-1");
    expect(deleteClient).toHaveBeenCalledWith("client-1");
  });
});
