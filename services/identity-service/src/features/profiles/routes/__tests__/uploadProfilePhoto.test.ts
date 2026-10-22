import type { HttpRequest } from "@pine/server";
import { UnauthorizedError } from "@pine/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { InvalidProfilePhotoError } from "@/features/profiles/errors";
import { uploadProfilePhoto } from "@/features/profiles/routes/uploadProfilePhoto";

const httpRequest = (partial: Partial<HttpRequest>): HttpRequest => {
  return {
    method: partial.method ?? "POST",
    url: partial.url ?? "/identity/me/photo",
    headers: partial.headers ?? {},
    query: partial.query ?? {},
    params: partial.params ?? {},
    cookies: partial.cookies ?? {},
    body: partial.body,
    identity: partial.identity,
    file: partial.file ?? (async () => undefined),
    isMultipart: partial.isMultipart ?? (() => false),
  };
};

describe("uploadProfilePhoto route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("stores the uploaded image for the signed-in identity", async () => {
    const body = Buffer.from("image");
    const uploadPhoto = vi.fn().mockResolvedValue({
      id: "profile-1",
      photoUrl: "https://localhost/api/identity/profiles/identity-1/photo?v=1",
    });
    get.mockReturnValue({ uploadPhoto });

    const response = await uploadProfilePhoto.handler(
      httpRequest({
        identity: { id: "identity-1", authMethod: "session" },
        isMultipart: () => true,
        file: async () => ({
          fieldname: "file",
          filename: "photo.png",
          mimetype: "image/png",
          encoding: "7bit",
          toBuffer: async () => body,
        }),
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.ProfileService);
    expect(uploadPhoto).toHaveBeenCalledWith({
      identityId: "identity-1",
      contentType: "image/png",
      body,
    });
    expect(response).toEqual({
      status: 200,
      body: {
        data: {
          photoUrl: "https://localhost/api/identity/profiles/identity-1/photo?v=1",
        },
      },
    });
  });

  it("rejects a signed-out upload", async () => {
    await expect(uploadProfilePhoto.handler(httpRequest({}))).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects a request that is not a file upload", async () => {
    await expect(
      uploadProfilePhoto.handler(
        httpRequest({
          identity: { id: "identity-1", authMethod: "session" },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidProfilePhotoError);
    expect(get).not.toHaveBeenCalled();
  });
});
