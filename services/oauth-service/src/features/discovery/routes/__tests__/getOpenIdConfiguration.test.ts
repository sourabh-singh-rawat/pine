import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { getOpenIdConfiguration } from "@/features/discovery/routes/getOpenIdConfiguration";

const httpRequest = (partial: Partial<HttpRequest> = {}): HttpRequest => ({
  method: partial.method ?? "GET",
  url: partial.url ?? "/oauth/.well-known/openid-configuration",
  headers: partial.headers ?? {},
  query: partial.query ?? {},
  params: partial.params ?? {},
  cookies: partial.cookies ?? {},
  body: partial.body,
  file: partial.file ?? (async () => undefined),
});

describe("getOpenIdConfiguration route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("is a GET discovery endpoint under /oauth/.well-known", () => {
    expect(getOpenIdConfiguration.method).toBe("GET");
    expect(getOpenIdConfiguration.url).toBe("/oauth/.well-known/openid-configuration");
    expect(getOpenIdConfiguration.schema).toMatchObject({
      operationId: "getOpenIdConfiguration",
    });
  });

  it("returns the raw OpenID configuration document", async () => {
    const configuration = {
      issuer: "https://localhost/api/oauth",
      authorization_endpoint: "https://localhost/api/oauth/authorize",
      token_endpoint: "https://localhost/api/oauth/token",
      jwks_uri: "https://localhost/api/oauth/.well-known/jwks.json",
      introspection_endpoint: "https://localhost/api/oauth/introspect",
    };
    const getOpenIdConfigurationFn = vi.fn().mockResolvedValue(configuration);
    get.mockReturnValue({ getOpenIdConfiguration: getOpenIdConfigurationFn });

    const response = await getOpenIdConfiguration.handler(httpRequest());

    expect(get).toHaveBeenCalledWith(TYPES.DiscoveryService);
    expect(getOpenIdConfigurationFn).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: configuration,
    });
  });
});
