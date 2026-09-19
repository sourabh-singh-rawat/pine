import type { HttpIdentity, HttpRequest } from "@pine/server";
import { describe, expect, it } from "vitest";
import { createContext } from "@/graphql/context";

const httpRequest = (options?: {
  headers?: Record<string, string | undefined>;
  identity?: HttpIdentity;
}): HttpRequest => ({
  method: "POST",
  url: "/graphql",
  headers: options?.headers ?? {},
  query: {},
  params: {},
  cookies: { session: "session-cookie" },
  body: {},
  ...(options?.identity ? { identity: options.identity } : {}),
  file: async () => undefined,
  isMultipart: () => false,
});

describe("createContext", () => {
  it("resolves the identity from request identity", async () => {
    const ctx = await createContext(
      httpRequest({ identity: { id: "identity-1", authMethod: "access_token" } }),
    );

    expect(ctx.identity).toEqual({ id: "identity-1", authMethod: "access_token" });
    expect(ctx.cookies).toBeUndefined();
  });

  it("returns no identity when identity is not present", async () => {
    const ctx = await createContext(httpRequest());

    expect(ctx.identity).toBeUndefined();
    expect(ctx.cookies).toBeUndefined();
  });
});
