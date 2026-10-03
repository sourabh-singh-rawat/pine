import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { getJwks } from "@/features/discovery/routes/getJwks";

const httpRequest = (partial: Partial<HttpRequest> = {}): HttpRequest => ({
  method: partial.method ?? "GET",
  url: partial.url ?? "/oauth/.well-known/jwks.json",
  headers: partial.headers ?? {},
  query: partial.query ?? {},
  params: partial.params ?? {},
  cookies: partial.cookies ?? {},
  body: partial.body,
  file: partial.file ?? (async () => undefined),
});

describe("getJwks route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("is a GET JWKS endpoint under /oauth/.well-known", () => {
    expect(getJwks.method).toBe("GET");
    expect(getJwks.url).toBe("/oauth/.well-known/jwks.json");
    expect(getJwks.schema).toMatchObject({
      operationId: "getJwks",
    });
  });

  it("returns the raw JWKS document", async () => {
    const jwks = { keys: [{ kty: "RSA", kid: "key-1", alg: "RS256" }] };
    const getJwksFn = vi.fn().mockResolvedValue(jwks);
    get.mockReturnValue({ getJwks: getJwksFn });

    const response = await getJwks.handler(httpRequest());

    expect(get).toHaveBeenCalledWith(TYPES.DiscoveryService);
    expect(getJwksFn).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: jwks,
    });
  });
});
