import { beforeEach, describe, expect, it, vi } from "vitest";

const { oauthClients } = vi.hoisted(() => ({
  oauthClients: [
    {
      clientId: "pine-web",
      name: "Pine",
      redirectUris: ["https://localhost:3001/callback"],
      grantTypes: ["authorization_code", "refresh_token"],
      scopes: ["openid", "offline", "email"],
      tokenEndpointAuthMethod: "none" as const,
    },
  ],
}));

vi.mock("@/bootstrap/oauth-clients", () => ({ oauthClients }));

import { ClientSeederService } from "../ClientSeederService";

const createLogger = () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
});

describe("ClientSeederService.seed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers missing oauth clients", async () => {
    const getClient = vi.fn().mockResolvedValue(null);
    const registerClient = vi.fn().mockResolvedValue({});
    const updateClient = vi.fn();
    const logger = createLogger();
    const service = new ClientSeederService(
      { getClient, registerClient, updateClient, deleteClient: vi.fn() },
      logger as never,
    );

    await service.seed();

    expect(registerClient).toHaveBeenCalledWith(oauthClients[0]);
    expect(updateClient).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("oauth client registered client_id=pine-web");
  });

  it("updates oauth clients when redirect uris change", async () => {
    const getClient = vi.fn().mockResolvedValue({
      clientId: "pine-web",
      redirectUris: ["http://localhost:3001/callback"],
    });
    const registerClient = vi.fn();
    const updateClient = vi.fn().mockResolvedValue({});
    const logger = createLogger();
    const service = new ClientSeederService(
      { getClient, registerClient, updateClient, deleteClient: vi.fn() },
      logger as never,
    );

    await service.seed();

    expect(updateClient).toHaveBeenCalledWith(oauthClients[0]);
    expect(registerClient).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("oauth client updated client_id=pine-web");
  });

  it("skips oauth clients that already match", async () => {
    const getClient = vi.fn().mockResolvedValue({
      clientId: "pine-web",
      redirectUris: ["https://localhost:3001/callback"],
    });
    const registerClient = vi.fn();
    const updateClient = vi.fn();
    const logger = createLogger();
    const service = new ClientSeederService(
      { getClient, registerClient, updateClient, deleteClient: vi.fn() },
      logger as never,
    );

    await service.seed();

    expect(registerClient).not.toHaveBeenCalled();
    expect(updateClient).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("oauth client exists client_id=pine-web");
  });
});
