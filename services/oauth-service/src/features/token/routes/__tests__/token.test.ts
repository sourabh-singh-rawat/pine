import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { token } from "@/features/token/routes/token";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

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

describe("token route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("is a POST endpoint for exchanging an authorization code", () => {
    expect(token.method).toBe("POST");
    expect(token.url).toBe("/oauth/token");
    expect(token.schema).toMatchObject({
      body: expect.anything(),
    });
  });

  it("rejects invalid token body", async () => {
    await expect(
      token.handler(
        httpRequest({
          method: "POST",
          body: {
            grant_type: "refresh_token",
            code: "auth-code-1",
            client_id: "pine-web",
            redirect_uri: "http://localhost:3001/callback",
            code_verifier: "verifier-1",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
    expect(get).not.toHaveBeenCalled();
  });

  it("exchanges a code via the token service and sets tokens as HTTP-only cookies", async () => {
    const exchange = vi.fn().mockResolvedValue({
      accessToken: "access-1",
      tokenType: "bearer",
      expiresIn: 3600,
      refreshToken: "refresh-1",
      idToken: "id-1",
      scope: "openid offline",
    });
    get.mockReturnValue({ exchange });

    const response = await token.handler(
      httpRequest({
        method: "POST",
        body: {
          grant_type: "authorization_code",
          code: "auth-code-1",
          client_id: "pine-web",
          redirect_uri: "http://localhost:3001/callback",
          code_verifier: "verifier-1",
        },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.TokenService);
    expect(exchange).toHaveBeenCalledWith({
      grantType: "authorization_code",
      code: "auth-code-1",
      clientId: "pine-web",
      redirectUri: "http://localhost:3001/callback",
      codeVerifier: "verifier-1",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Tokens issued successfully.",
    });
    expect(response.cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "accessToken",
          value: "access-1",
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: true,
          expires: expect.any(Date),
        }),
        expect.objectContaining({
          name: "refreshToken",
          value: "refresh-1",
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: true,
        }),
        expect.objectContaining({
          name: "idToken",
          value: "id-1",
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: true,
          expires: expect.any(Date),
        }),
      ]),
    );
  });

  it("propagates InvalidOAuthRequestError from the token service", async () => {
    const exchange = vi.fn().mockRejectedValue(new InvalidOAuthRequestError());
    get.mockReturnValue({ exchange });

    await expect(
      token.handler(
        httpRequest({
          method: "POST",
          body: {
            grant_type: "authorization_code",
            code: "bad-code",
            client_id: "pine-web",
            redirect_uri: "http://localhost:3001/callback",
            code_verifier: "verifier-1",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
  });
});

describe("introspect route", () => {
  it.todo("introspects a bearer token and returns active status and claims");

  it.todo("revokes a token and returns success");
});
