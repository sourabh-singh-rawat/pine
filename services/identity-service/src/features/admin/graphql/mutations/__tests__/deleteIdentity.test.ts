import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, mutationFields, inputType } = vi.hoisted(() => ({
  get: vi.fn(),
  mutationFields: vi.fn(),
  inputType: vi.fn((_name: string, config: unknown) => config),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
  TYPES: { AdminService: Symbol.for("IAdminService") },
}));

vi.mock("@pine/server", () => ({
  builder: {
    mutationFields,
    inputType,
  },
}));

describe("deleteIdentity mutation", () => {
  beforeEach(() => {
    get.mockReset();
    mutationFields.mockReset();
    inputType.mockClear();
    vi.resetModules();
  });

  it("deletes the identity via AdminService and returns a success message", async () => {
    const deleteIdentityFn = vi.fn().mockResolvedValue(undefined);
    get.mockReturnValue({ deleteIdentity: deleteIdentityFn });

    let resolve:
      | ((root: unknown, args: { input: { identityId: string } }) => Promise<string>)
      | undefined;

    mutationFields.mockImplementation((fn: (t: unknown) => unknown) => {
      const t = {
        string: (config: {
          resolve: (root: unknown, args: { input: { identityId: string } }) => Promise<string>;
        }) => {
          resolve = config.resolve;
          return config;
        },
        arg: (opts: unknown) => opts,
      };
      return fn(t);
    });

    await import("@/features/admin/graphql/inputs/DeleteIdentityInput");
    await import("@/features/admin/graphql/mutations/deleteIdentity");

    const identityId = "01900000-0000-7000-8000-000000000001";
    const response = await resolve!(null, { input: { identityId } });

    expect(get).toHaveBeenCalledWith(Symbol.for("IAdminService"));
    expect(deleteIdentityFn).toHaveBeenCalledWith(identityId);
    expect(response).toBe("Identity deleted successfully.");
  });

  it("keeps identityId on DeleteIdentityInput", async () => {
    await import("@/features/admin/graphql/inputs/DeleteIdentityInput");

    expect(inputType).toHaveBeenCalledWith(
      "DeleteIdentityInput",
      expect.objectContaining({
        fields: expect.any(Function),
      }),
    );

    const config = inputType.mock.calls[0][1] as {
      fields: (t: {
        string: (opts: { required: boolean }) => { required: boolean };
      }) => Record<string, unknown>;
    };

    const fields = config.fields({
      string: (opts) => opts,
    });

    expect(fields).toEqual({
      identityId: { required: true },
    });
  });
});
