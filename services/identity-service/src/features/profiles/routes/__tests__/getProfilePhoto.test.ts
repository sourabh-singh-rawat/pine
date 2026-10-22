import { Readable } from "node:stream";
import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { getProfilePhoto } from "@/features/profiles/routes/getProfilePhoto";

const httpRequest = (partial: Partial<HttpRequest>): HttpRequest => {
  return {
    method: partial.method ?? "GET",
    url: partial.url ?? "/identity/profiles/identity-1/photo",
    headers: partial.headers ?? {},
    query: partial.query ?? {},
    params: partial.params ?? { identityId: "identity-1" },
    cookies: partial.cookies ?? {},
    body: partial.body,
    file: partial.file ?? (async () => undefined),
    isMultipart: partial.isMultipart ?? (() => false),
  };
};

describe("getProfilePhoto route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("returns the stored image", async () => {
    const body = Readable.from(Buffer.from("image"));
    const getProfilePhotoContent = vi.fn().mockResolvedValue({
      body,
      contentType: "image/png",
      contentLength: 5,
    });
    get.mockReturnValue({ getProfilePhoto: getProfilePhotoContent });

    const response = await getProfilePhoto.handler(httpRequest({}));

    expect(get).toHaveBeenCalledWith(TYPES.ProfileService);
    expect(getProfilePhotoContent).toHaveBeenCalledWith("identity-1");
    expect(response.status).toBe(200);
    expect(response.headers).toEqual({
      "content-type": "image/png",
      "cache-control": "private, no-cache",
      "content-disposition": 'inline; filename="photo.png"',
      "content-length": "5",
    });
    expect(response.body).toBe(body);
  });
});
