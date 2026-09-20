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

vi.mock("@/features/profiles/graphql/objects/ProfileGenderEnum", () => ({
  ProfileGenderEnum: "ProfileGender",
}));

describe("createProfile mutation", () => {
  beforeEach(() => {
    get.mockReset();
    mutationFields.mockReset();
    inputType.mockClear();
    vi.resetModules();
  });

  it("creates a profile via ProfileService for the authenticated identity", async () => {
    const created = {
      id: "profile-1",
      identityId: "identity-1",
      firstName: "Ada",
      lastName: "Lovelace",
      gender: "FEMALE",
    };
    const create = vi.fn().mockResolvedValue(created);
    get.mockReturnValue({ create });

    let resolve:
      | ((
          root: unknown,
          args: {
            input: {
              firstName: string;
              middleName?: string | null;
              lastName?: string | null;
              gender?: string | null;
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
                gender?: string | null;
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

    await import("@/features/profiles/graphql/inputs/CreateProfileInput");
    await import("@/features/profiles/graphql/mutations/createProfile");

    const response = await resolve!(
      null,
      {
        input: {
          firstName: "Ada",
          lastName: "Lovelace",
          gender: "FEMALE",
        },
      },
      { identity: { id: "identity-1" } },
    );

    expect(get).toHaveBeenCalledWith(Symbol.for("IProfileService"));
    expect(create).toHaveBeenCalledWith({
      identityId: "identity-1",
      firstName: "Ada",
      middleName: undefined,
      lastName: "Lovelace",
      gender: "FEMALE",
    });
    expect(response).toEqual(created);
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

    await import("@/features/profiles/graphql/mutations/createProfile");

    expect(fieldConfig).toEqual(
      expect.objectContaining({
        authScopes: { identityRequired: true },
      }),
    );
  });

  it("keeps expected fields on CreateProfileInput", async () => {
    await import("@/features/profiles/graphql/inputs/CreateProfileInput");

    expect(inputType).toHaveBeenCalledWith(
      "CreateProfileInput",
      expect.objectContaining({
        fields: expect.any(Function),
      }),
    );

    const config = inputType.mock.calls[0][1] as {
      fields: (t: {
        string: (opts: { required: boolean }) => { required: boolean };
        field: (opts: { type: unknown; required: boolean }) => {
          type: unknown;
          required: boolean;
        };
      }) => Record<string, unknown>;
    };

    const fields = config.fields({
      string: (opts) => opts,
      field: (opts) => opts,
    });

    expect(fields).toEqual({
      firstName: { required: true },
      middleName: { required: false },
      lastName: { required: false },
      gender: { type: "ProfileGender", required: false },
    });
  });
});
