import { describe, expect, it } from "vitest";
import { parseSetCookieHeader } from "@/integrations/oauth/ory-hydra/parseSetCookieHeader";

describe("parseSetCookieHeader", () => {
  it("parses name, value, and cookie attributes", () => {
    expect(
      parseSetCookieHeader("ory_hydra_session=abc; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600"),
    ).toEqual({
      name: "ory_hydra_session",
      value: "abc",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3600,
    });
  });

  it("rewrites Hydra oauth2 paths to root", () => {
    expect(parseSetCookieHeader("csrf=token; Path=/oauth2/auth; Secure")).toEqual({
      name: "csrf",
      value: "token",
      path: "/",
      secure: true,
    });
  });

  it("ignores Domain attributes so cookies bind to the public host", () => {
    expect(parseSetCookieHeader("session=1; Domain=127.0.0.1; Path=/")).toEqual({
      name: "session",
      value: "1",
      path: "/",
    });
  });

  it("returns undefined for malformed headers", () => {
    expect(parseSetCookieHeader("")).toBeUndefined();
    expect(parseSetCookieHeader("=novalue")).toBeUndefined();
  });
});
