import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { logout } from "@/features/logout/routes/logout";
import { InvalidCredentialError } from "@/integrations/identity";

const httpRequest = (partial: Partial<HttpRequest>): HttpRequest => ({
  method: partial.method ?? "POST",
  url: partial.url ?? "/identity/logout",
  headers: partial.headers ?? {},
  query: partial.query ?? {},
  params: partial.params ?? {},
  cookies: partial.cookies ?? {},
  body: partial.body,
  file: partial.file ?? (async () => undefined),
});

describe("logout route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("logs out with the session cookie and clears it", async () => {
    const logoutFn = vi.fn().mockResolvedValue(undefined);
    get.mockReturnValue({ logout: logoutFn });

    const response = await logout.handler(
      httpRequest({
        cookies: { session: "session-token-1" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.LogoutService);
    expect(logoutFn).toHaveBeenCalledWith("session-token-1");
    expect(response).toEqual({
      status: 200,
      body: {
        message: "Logged out successfully.",
      },
      clearCookies: [
        {
          name: "session",
          path: "/",
          sameSite: "lax",
          secure: true,
        },
      ],
    });
  });

  it("throws InvalidCredentialError when the session cookie is missing", async () => {
    const logoutFn = vi.fn();
    get.mockReturnValue({ logout: logoutFn });

    await expect(logout.handler(httpRequest({ cookies: {} }))).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );

    expect(logoutFn).not.toHaveBeenCalled();
  });
});
