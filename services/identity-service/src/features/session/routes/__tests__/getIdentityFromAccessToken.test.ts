import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { getIdentityFromAccessToken } from "@/features/session/routes/getIdentityFromAccessToken";
import { InvalidCredentialError } from "@/integrations/identity";

const httpRequest = (partial: Partial<HttpRequest>): HttpRequest => {
  return {
    method: partial.method ?? "GET",
    url: partial.url ?? "/identity/getIdentityFromAccessToken",
    headers: partial.headers ?? {},
    query: partial.query ?? {},
    params: partial.params ?? {},
    cookies: partial.cookies ?? {},
    body: partial.body,
    file: partial.file ?? (async () => undefined),
  };
};

describe("getIdentityFromAccessToken route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("returns the identity for a valid bearer access token", async () => {
    const getIdentityFromAccessTokenFn = vi.fn().mockResolvedValue({
      id: "identity-1",
      email: "a@b.com",
      emailVerified: true,
    });
    get.mockReturnValue({ getIdentityFromAccessToken: getIdentityFromAccessTokenFn });

    const response = await getIdentityFromAccessToken.handler(
      httpRequest({
        headers: { authorization: "Bearer access-token-1" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.SessionService);
    expect(getIdentityFromAccessTokenFn).toHaveBeenCalledWith("access-token-1");
    expect(response).toEqual({
      status: 200,
      body: {
        identity: {
          id: "identity-1",
          email: "a@b.com",
          emailVerified: true,
        },
      },
    });
  });

  it("throws InvalidCredentialError when the Authorization header is missing", async () => {
    const getIdentityFromAccessTokenFn = vi.fn();
    get.mockReturnValue({ getIdentityFromAccessToken: getIdentityFromAccessTokenFn });

    await expect(
      getIdentityFromAccessToken.handler(httpRequest({ headers: {} })),
    ).rejects.toBeInstanceOf(InvalidCredentialError);

    expect(getIdentityFromAccessTokenFn).not.toHaveBeenCalled();
  });
});
