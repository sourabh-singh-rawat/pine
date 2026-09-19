import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileGender } from "@/features/profiles/constants";

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

describe("updateProfileGender mutation", () => {
  beforeEach(() => {
    get.mockReset();
    mutationFields.mockReset();
    inputType.mockClear();
    vi.resetModules();
  });

  it("updates gender via ProfileService for the authenticated identity", async () => {
    const updated = { id: "profile-1", gender: ProfileGender.FEMALE };
    const updateGender = vi.fn().mockResolvedValue(updated);
    get.mockReturnValue({ updateGender });

    let resolve:
      | ((
          root: unknown,
          args: { input: { gender: string } },
          ctx: { identity?: { id: string } },
        ) => Promise<unknown>)
      | undefined;

    mutationFields.mockImplementation((fn: (t: unknown) => unknown) => {
      const t = {
        field: (config: {
          resolve: (
            root: unknown,
            args: { input: { gender: string } },
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

    await import("@/features/profiles/graphql/inputs/UpdateProfileGenderInput");
    await import("@/features/profiles/graphql/mutations/updateProfileGender");

    const response = await resolve!(
      null,
      { input: { gender: ProfileGender.FEMALE } },
      { identity: { id: "identity-1" } },
    );

    expect(get).toHaveBeenCalledWith(Symbol.for("IProfileService"));
    expect(updateGender).toHaveBeenCalledWith({
      identityId: "identity-1",
      gender: ProfileGender.FEMALE,
    });
    expect(response).toEqual(updated);
  });
});
