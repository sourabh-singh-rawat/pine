import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, mutationFields, inputType } = vi.hoisted(() => ({
  get: vi.fn(),
  mutationFields: vi.fn(),
  inputType: vi.fn((_name: string, config: unknown) => config),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
  TYPES: { ProfileService: Symbol.for("IProfileService") },
}));

vi.mock("@pine/server", () => ({
  builder: {
    mutationFields,
    inputType,
    objectRef: vi.fn(() => ({ implement: vi.fn() })),
    enumType: vi.fn((_name: string, config: unknown) => config),
  },
}));

vi.mock("@/features/profiles/graphql/objects/ProfileObject", () => ({
  ProfileObject: "ProfileObject",
}));

describe("updateProfileName mutation", () => {
  beforeEach(() => {
    get.mockReset();
    mutationFields.mockReset();
    inputType.mockClear();
    vi.resetModules();
  });

  it("updates the name via ProfileService for the authenticated identity", async () => {
    const updated = { id: "profile-1", firstName: "Grace", lastName: "Hopper" };
    const updateName = vi.fn().mockResolvedValue(updated);
    get.mockReturnValue({ updateName });

    let resolve:
      | ((
          root: unknown,
          args: {
            input: {
              firstName: string;
              middleName?: string | null;
              lastName?: string | null;
            };
          },
          ctx: { identity?: { id: string } },
        ) => Promise<unknown>)
      | undefined;

    mutationFields.mockImplementation((fn: (t: unknown) => unknown) => {
      const t = {
        field: (config: {
          resolve: (
            root: unknown,
            args: {
              input: {
                firstName: string;
                middleName?: string | null;
                lastName?: string | null;
              };
            },
            ctx: { identity?: { id: string } },
          ) => Promise<unknown>;
        }) => {
          resolve = config.resolve;
          return config;
        },
        arg: (opts: unknown) => opts,
      };
      return fn(t);
    });

    await import("@/features/profiles/graphql/inputs/UpdateProfileNameInput");
    await import("@/features/profiles/graphql/mutations/updateProfileName");

    const response = await resolve!(
      null,
      {
        input: {
          firstName: "Grace",
          lastName: "Hopper",
        },
      },
      { identity: { id: "identity-1" } },
    );

    expect(get).toHaveBeenCalledWith(Symbol.for("IProfileService"));
    expect(updateName).toHaveBeenCalledWith({
      identityId: "identity-1",
      firstName: "Grace",
      middleName: undefined,
      lastName: "Hopper",
    });
    expect(response).toEqual(updated);
  });

  it("configures authScopes with identityRequired", async () => {
    let fieldConfig: unknown;

    mutationFields.mockImplementation((fn: (t: unknown) => unknown) => {
      const t = {
        field: (config: unknown) => {
          fieldConfig = config;
          return config;
        },
        arg: (opts: unknown) => opts,
      };
      return fn(t);
    });

    await import("@/features/profiles/graphql/mutations/updateProfileName");

    expect(fieldConfig).toEqual(
      expect.objectContaining({
        authScopes: { identityRequired: true },
      }),
    );
  });

  it("keeps expected fields on UpdateProfileNameInput", async () => {
    await import("@/features/profiles/graphql/inputs/UpdateProfileNameInput");

    expect(inputType).toHaveBeenCalledWith(
      "UpdateProfileNameInput",
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
      firstName: { required: true },
      middleName: { required: false },
      lastName: { required: false },
    });
  });
});
