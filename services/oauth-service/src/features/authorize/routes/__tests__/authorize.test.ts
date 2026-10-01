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

  it("redirects to the authorization URL from the authorize service", async () => {
    const redirectTo = "http://127.0.0.1:4444/oauth2/auth?client_id=issues-web";
    const authorizeFn = vi.fn().mockResolvedValue({ redirectTo });
    get.mockReturnValue({ authorize: authorizeFn });

    const response = await authorize.handler(
      httpRequest({
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
      clientId: "issues-web",
      redirectUri: "http://localhost:3000/callback",
      responseType: "code",
      scope: "openid offline",
      state: "state-1",
      codeChallenge: "challenge",
      codeChallengeMethod: "S256",
      nonce: "nonce-1",
    });
    expect(response).toEqual({
      status: 302,
      headers: { Location: redirectTo },
    });
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
