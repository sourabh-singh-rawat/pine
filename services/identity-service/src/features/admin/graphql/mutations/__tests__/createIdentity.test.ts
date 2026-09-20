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
    objectRef: vi.fn(() => ({ implement: vi.fn() })),
  },
}));

vi.mock("@/features/admin/graphql/objects/IdentityObject", () => ({
  IdentityObject: "IdentityObject",
}));

describe("createIdentity mutation", () => {
  beforeEach(() => {
    get.mockReset();
    mutationFields.mockReset();
    inputType.mockClear();
    vi.resetModules();
  });

  it("creates the identity via AdminService and returns the local identity", async () => {
    const created = {
      id: "identity-1",
      createdAt: new Date("2026-01-01"),
      updatedAt: null,
    };
    const createIdentityFn = vi.fn().mockResolvedValue(created);
    get.mockReturnValue({ createIdentity: createIdentityFn });

    let resolve:
      | ((
          root: unknown,
          args: {
            input: {
              email: string;
              username: string;
              password: string;
              emailVerified: boolean;
              firstName: string;
              middleName?: string | null;
              lastName?: string | null;
            };
          },
        ) => Promise<unknown>)
      | undefined;

    mutationFields.mockImplementation((fn: (t: unknown) => unknown) => {
      const t = {
        field: (config: {
          resolve: (
            root: unknown,
            args: {
              input: {
                email: string;
                username: string;
                password: string;
                firstName: string;
                middleName?: string | null;
                lastName?: string | null;
              };
            },
          ) => Promise<unknown>;
        }) => {
          resolve = config.resolve;
          return config;
        },
        arg: (opts: unknown) => opts,
      };
      return fn(t);
    });

    await import("@/features/admin/graphql/inputs/CreateIdentityInput");
    await import("@/features/admin/graphql/mutations/createIdentity");

    const response = await resolve!(null, {
      input: {
        email: "admin@pine.local",
        username: "admin",
        password: "secret",
        emailVerified: true,
        firstName: "Sourabh",
        lastName: "Rawat",
      },
    });

    expect(get).toHaveBeenCalledWith(Symbol.for("IAdminService"));
    expect(createIdentityFn).toHaveBeenCalledWith({
      email: "admin@pine.local",
      username: "admin",
      password: "secret",
      emailVerified: true,
      firstName: "Sourabh",
      middleName: undefined,
      lastName: "Rawat",
    });
    expect(response).toEqual(created);
  });

  it("keeps expected fields on CreateIdentityInput", async () => {
    await import("@/features/admin/graphql/inputs/CreateIdentityInput");

    expect(inputType).toHaveBeenCalledWith(
      "CreateIdentityInput",
      expect.objectContaining({
        fields: expect.any(Function),
      }),
    );

    const config = inputType.mock.calls[0][1] as {
      fields: (t: {
        string: (opts: { required: boolean }) => { required: boolean };
        boolean: (opts: { required: boolean }) => { required: boolean };
      }) => Record<string, unknown>;
    };

    const fields = config.fields({
      string: (opts) => opts,
      boolean: (opts) => opts,
    });

    expect(fields).toEqual({
      email: { required: true },
      username: { required: true },
      password: { required: true },
      emailVerified: { required: true },
      firstName: { required: true },
      middleName: { required: false },
      lastName: { required: false },
    });
  });
});
