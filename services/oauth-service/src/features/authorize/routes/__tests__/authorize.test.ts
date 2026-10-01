import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { authorize } from "@/features/authorize/routes/authorize";
import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
} from "@/integrations/oauth/errors";

const httpRequest = (partial: Partial<HttpRequest>): HttpRequest => ({
  method: partial.method ?? "GET",
  url: partial.url ?? "/",
  headers: partial.headers ?? {},
  query: partial.query ?? {},
  params: partial.params ?? {},
  cookies: partial.cookies ?? {},
  body: partial.body,
  file: partial.file ?? (async () => undefined),
  isMultipart: partial.isMultipart ?? (() => false),
});

describe("authorize route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("is a GET endpoint that accepts OAuth authorize query params", () => {
    expect(authorize.method).toBe("GET");
    expect(authorize.url).toBe("/oauth/authorize");
    expect(authorize.schema).toMatchObject({
      querystring: expect.anything(),
    });
  });

  it("proxies the authorize request and returns the provider response", async () => {
    const location = "https://localhost:3000/signin?login_challenge=abc";
    const authorizeFn = vi.fn().mockResolvedValue({
      status: 302,
      location,
      cookies: [{ name: "ory_hydra_session", value: "s1", path: "/", httpOnly: true }],
    });
    get.mockReturnValue({ authorize: authorizeFn });

    const response = await authorize.handler(
      httpRequest({
        url: "/oauth/authorize?response_type=code&client_id=issues-web&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=openid&state=state-1&code_challenge=challenge&code_challenge_method=S256&nonce=nonce-1",
        headers: { cookie: "existing=1" },
        query: {
          client_id: "issues-web",
          redirect_uri: "http://localhost:3000/callback",
          response_type: "code",
          scope: "openid offline",
          state: "state-1",
          code_challenge: "challenge",
          code_challenge_method: "S256",
          nonce: "nonce-1",
        },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.AuthorizeService);
    expect(authorizeFn).toHaveBeenCalledWith({
      search:
        "?response_type=code&client_id=issues-web&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=openid&state=state-1&code_challenge=challenge&code_challenge_method=S256&nonce=nonce-1",
      cookieHeader: "existing=1",
    });
    expect(response).toEqual({
      status: 302,
      headers: { Location: location },
      cookies: [{ name: "ory_hydra_session", value: "s1", path: "/", httpOnly: true }],
    });
  });

  it("allows login_verifier continue requests without initial authorize fields", async () => {
    const authorizeFn = vi.fn().mockResolvedValue({
      status: 302,
      location: "https://localhost:3000/consent?consent_challenge=xyz",
      cookies: [],
    });
    get.mockReturnValue({ authorize: authorizeFn });

    const response = await authorize.handler(
      httpRequest({
        url: "/oauth/authorize?login_verifier=abc&client_id=pine-web",
        query: {
          login_verifier: "abc",
          client_id: "pine-web",
        },
      }),
    );

    expect(authorizeFn).toHaveBeenCalledWith({
      search: "?login_verifier=abc&client_id=pine-web",
      cookieHeader: undefined,
    });
    expect(response.status).toBe(302);
  });

  it("rejects invalid authorize query parameters", async () => {
    await expect(
      authorize.handler(
        httpRequest({
          query: {
            client_id: "issues-web",
            redirect_uri: "http://localhost:3000/callback",
            response_type: "token",
            scope: "openid",
            state: "state-1",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects missing required authorize query parameters", async () => {
    await expect(
      authorize.handler(
        httpRequest({
          query: {
            client_id: "issues-web",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
    expect(get).not.toHaveBeenCalled();
  });

  it("propagates InvalidOAuthRequestError from the authorize service", async () => {
    const authorizeFn = vi.fn().mockRejectedValue(new InvalidOAuthRequestError());
    get.mockReturnValue({ authorize: authorizeFn });

    await expect(
      authorize.handler(
        httpRequest({
          url: "/oauth/authorize?response_type=code&client_id=issues-web&redirect_uri=http://localhost:3000/callback&scope=openid&state=state-1",
          query: {
            client_id: "issues-web",
            redirect_uri: "http://localhost:3000/callback",
            response_type: "code",
            scope: "openid",
            state: "state-1",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
  });

  it("propagates OAuthProviderUnavailableError from the authorize service", async () => {
    const authorizeFn = vi.fn().mockRejectedValue(new OAuthProviderUnavailableError());
    get.mockReturnValue({ authorize: authorizeFn });

    await expect(
      authorize.handler(
        httpRequest({
          url: "/oauth/authorize?response_type=code&client_id=issues-web&redirect_uri=http://localhost:3000/callback&scope=openid&state=state-1",
          query: {
            client_id: "issues-web",
            redirect_uri: "http://localhost:3000/callback",
            response_type: "code",
            scope: "openid",
            state: "state-1",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
  });
});
