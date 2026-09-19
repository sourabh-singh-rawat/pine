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

vi.mock("@/features/profiles/graphql/objects/PhotoUploadTargetObject", () => ({
  PhotoUploadTargetObject: "PhotoUploadTargetObject",
}));

describe("createPhotoUploadRequest mutation", () => {
  beforeEach(() => {
    get.mockReset();
    mutationFields.mockReset();
    inputType.mockClear();
    vi.resetModules();
  });

  it("delegates to ProfileService with identity from context", async () => {
    const uploadResult = {
      uploadRequestId: "req-1",
      url: "https://storage.example.com/upload",
      headers: [{ key: "Content-Type", value: "image/png" }],
      expiresAt: "2026-08-25T22:00:00.000Z",
    };
    const createPhotoUploadRequest = vi.fn().mockResolvedValue(uploadResult);
    get.mockReturnValue({ createPhotoUploadRequest });

    let resolve:
      | ((
          root: unknown,
          args: {
            input: {
              filename: string;
              contentType: string;
              size: number;
            };
          },
          ctx: { identity: { id: string; authMethod: "access_token" | "session" } },
        ) => Promise<unknown>)
      | undefined;

    mutationFields.mockImplementation((fn: (t: {
      field: (config: {
        resolve: (
          root: unknown,
          args: {
            input: {
              filename: string;
              contentType: string;
              size: number;
            };
          },
          ctx: { identity: { id: string; authMethod: "access_token" | "session" } },
        ) => Promise<unknown>;
      }) => unknown;
      arg: (opts: unknown) => unknown;
    }) => unknown) => {
      const t = {
        field: (config: {
          resolve: (
            root: unknown,
            args: {
              input: {
                filename: string;
                contentType: string;
                size: number;
              };
            },
            ctx: { identity: { id: string; authMethod: "access_token" | "session" } },
          ) => Promise<unknown>;
        }) => {
          resolve = config.resolve;
          return config;
        },
        arg: (opts: unknown) => opts,
      };
      return fn(t);
    });

    await import("@/features/profiles/graphql/inputs/CreatePhotoUploadRequestInput");
    await import("@/features/profiles/graphql/mutations/createPhotoUploadRequest");

    const response = await resolve!(
      null,
      {
        input: {
          filename: "avatar.png",
          contentType: "image/png",
          size: 1024,
        },
      },
      { identity: { id: "identity-1", authMethod: "session" } },
    );

    expect(get).toHaveBeenCalledWith(Symbol.for("IProfileService"));
    expect(createPhotoUploadRequest).toHaveBeenCalledWith({
      identityId: "identity-1",
      authMethod: "session",
      filename: "avatar.png",
      contentType: "image/png",
      size: 1024,
    });
    expect(response).toEqual(uploadResult);
  });

  it("configures authScopes with identityRequired", async () => {
    let fieldConfig: unknown;

    mutationFields.mockImplementation((fn: (t: { field: (config: unknown) => unknown; arg: (opts: unknown) => unknown }) => unknown) => {
      const t = {
        field: (config: unknown) => {
          fieldConfig = config;
          return config;
        },
        arg: (opts: unknown) => opts,
      };
      return fn(t);
    });

    await import("@/features/profiles/graphql/mutations/createPhotoUploadRequest");

    expect(fieldConfig).toEqual(
      expect.objectContaining({
        authScopes: { identityRequired: true },
      }),
    );
  });
});
