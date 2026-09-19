import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { getIdentityFromSession } from "@/features/session/routes/getIdentityFromSession";
import { InvalidCredentialError } from "@/integrations/identity";

const httpRequest = (partial: Partial<HttpRequest>): HttpRequest => {
  return {
    method: partial.method ?? "GET",
    url: partial.url ?? "/identity/getIdentityFromSession",
    headers: partial.headers ?? {},
    query: partial.query ?? {},
    params: partial.params ?? {},
    cookies: partial.cookies ?? {},
    body: partial.body,
    file: partial.file ?? (async () => undefined),
  };
};

describe("getIdentityFromSession route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("returns the identity for a valid session cookie", async () => {
    const getIdentityFromSessionToken = vi.fn().mockResolvedValue({
      id: "identity-1",
      email: "a@b.com",
      emailVerified: true,
    });
    get.mockReturnValue({ getIdentityFromSessionToken });

    const response = await getIdentityFromSession.handler(
      httpRequest({
        cookies: { session: "session-token-1" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.SessionService);
    expect(getIdentityFromSessionToken).toHaveBeenCalledWith("session-token-1");
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

  it("throws InvalidCredentialError when the session cookie is missing", async () => {
    const getIdentityFromSessionToken = vi.fn();
    get.mockReturnValue({ getIdentityFromSessionToken });

    await expect(getIdentityFromSession.handler(httpRequest({ cookies: {} }))).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );

    expect(getIdentityFromSessionToken).not.toHaveBeenCalled();
  });
});
