import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, queryFields } = vi.hoisted(() => ({
  get: vi.fn(),
  queryFields: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
  TYPES: { ClientService: Symbol.for("IClientService") },
}));

vi.mock("@pine/server", () => ({
  builder: {
    queryFields,
  },
}));

vi.mock("@/features/clients/graphql/objects/ClientObject", () => ({
  ClientObject: "ClientObject",
}));

describe("getClient query", () => {
  beforeEach(() => {
    get.mockReset();
    queryFields.mockReset();
    vi.resetModules();
  });

  it("returns the client from ClientService by id", async () => {
    const client = {
      id: "client-1",
      name: "pine-web",
      redirectUris: ["http://localhost/callback"],
      scopes: ["openid"],
      grantTypes: ["authorization_code"],
    };
    const getClientById = vi.fn().mockResolvedValue(client);
    get.mockReturnValue({ getClientById });

    let resolve:
      | ((_root: unknown, args: { id: string }) => Promise<typeof client | null>)
      | undefined;

    queryFields.mockImplementation((fn: (t: unknown) => unknown) => {
      const t = {
        field: (config: {
          resolve: (_root: unknown, args: { id: string }) => Promise<typeof client | null>;
        }) => {
          resolve = config.resolve;
          return config;
        },
        arg: {
          string: () => ({}),
        },
      };
      return fn(t);
    });

    await import("@/features/clients/graphql/queries/getClient");

    const response = await resolve!({}, { id: "client-1" });

    expect(get).toHaveBeenCalledWith(Symbol.for("IClientService"));
    expect(getClientById).toHaveBeenCalledWith("client-1");
    expect(response).toEqual(client);
  });

  it("returns null when the client does not exist", async () => {
    const getClientById = vi.fn().mockResolvedValue(null);
    get.mockReturnValue({ getClientById });

    let resolve: ((_root: unknown, args: { id: string }) => Promise<null>) | undefined;

    queryFields.mockImplementation((fn: (t: unknown) => unknown) => {
      const t = {
        field: (config: { resolve: (_root: unknown, args: { id: string }) => Promise<null> }) => {
          resolve = config.resolve;
          return config;
        },
        arg: {
          string: () => ({}),
        },
      };
      return fn(t);
    });

    await import("@/features/clients/graphql/queries/getClient");

    const response = await resolve!({}, { id: "missing" });

    expect(getClientById).toHaveBeenCalledWith("missing");
    expect(response).toBeNull();
  });
});
