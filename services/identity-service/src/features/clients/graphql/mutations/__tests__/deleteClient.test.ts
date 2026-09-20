import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, mutationFields } = vi.hoisted(() => ({
  get: vi.fn(),
  mutationFields: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
  TYPES: { ClientService: Symbol.for("IClientService") },
}));

vi.mock("@pine/server", () => ({
  builder: {
    mutationFields,
  },
}));

describe("deleteClient mutation", () => {
  beforeEach(() => {
    get.mockReset();
    mutationFields.mockReset();
    vi.resetModules();
  });

  it("deletes the client via ClientService and returns a success message", async () => {
    const deleteClientById = vi.fn().mockResolvedValue(undefined);
    get.mockReturnValue({ deleteClientById });

    let resolve: ((_root: unknown, args: { id: string }) => Promise<string>) | undefined;

    mutationFields.mockImplementation((fn: (t: unknown) => unknown) => {
      const t = {
        string: (config: {
          resolve: (_root: unknown, args: { id: string }) => Promise<string>;
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

    await import("@/features/clients/graphql/mutations/deleteClient");

    const response = await resolve!({}, { id: "client-1" });

    expect(get).toHaveBeenCalledWith(Symbol.for("IClientService"));
    expect(deleteClientById).toHaveBeenCalledWith("client-1");
    expect(response).toBe("Client deleted successfully.");
  });

  it("propagates errors when the client does not exist", async () => {
    const deleteClientById = vi.fn().mockRejectedValue(new Error("Client not found: missing"));
    get.mockReturnValue({ deleteClientById });

    let resolve: ((_root: unknown, args: { id: string }) => Promise<string>) | undefined;

    mutationFields.mockImplementation((fn: (t: unknown) => unknown) => {
      const t = {
        string: (config: {
          resolve: (_root: unknown, args: { id: string }) => Promise<string>;
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

    await import("@/features/clients/graphql/mutations/deleteClient");

    await expect(resolve!({}, { id: "missing" })).rejects.toThrow("Client not found: missing");
    expect(deleteClientById).toHaveBeenCalledWith("missing");
  });
});
