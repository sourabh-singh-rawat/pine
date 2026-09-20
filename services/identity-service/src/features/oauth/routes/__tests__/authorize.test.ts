import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { acceptConsent } from "@/features/oauth/routes/acceptConsent";
import { authorize } from "@/features/oauth/routes/authorize";
import { consent } from "@/features/oauth/routes/consent";
import { rejectConsent } from "@/features/oauth/routes/rejectConsent";
import { token } from "@/features/oauth/routes/token";
import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
  OAuthRequestNotFoundError,
} from "@/integrations/oauth/errors";

function httpRequest(partial: Partial<HttpRequest>): HttpRequest {
  return {
    method: partial.method ?? "GET",
    url: partial.url ?? "/",
    headers: partial.headers ?? {},
    query: partial.query ?? {},
    params: partial.params ?? {},
    cookies: partial.cookies ?? {},
    body: partial.body,
    file: partial.file ?? (async () => undefined),
  };
}

describe("authorize route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("is a GET endpoint that accepts OAuth authorize query params", () => {
    expect(authorize.method).toBe("GET");
    expect(authorize.url).toBe("/identity/oauth/authorize");
    expect(authorize.schema).toMatchObject({
      querystring: expect.anything(),
    });
  });

  it("redirects to the authorization URL from the OAuth service", async () => {
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

    expect(get).toHaveBeenCalledWith(TYPES.OAuthService);
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

  it("propagates InvalidOAuthRequestError from the OAuth service", async () => {
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

  it("propagates OAuthProviderUnavailableError from the OAuth service", async () => {
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

describe("OAuth login challenge routes", () => {
  it.todo("returns the login challenge details for a valid login_challenge");

  it.todo("accepts a login challenge when the user is authenticated and returns redirectTo");

  it.todo("rejects a login challenge when the user denies login and returns redirectTo");

  it.todo("returns not found when the login_challenge is unknown");
});

describe("OAuth consent challenge routes", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("is a GET endpoint that accepts a consent_challenge query param", () => {
    expect(consent.method).toBe("GET");
    expect(consent.url).toBe("/identity/oauth/consent");
    expect(consent.schema).toMatchObject({
      querystring: expect.anything(),
    });
  });

  it("returns the consent challenge details for a valid consent_challenge", async () => {
    const challenge = {
      challenge: "consent-challenge-1",
      skip: false,
      subject: "user-1",
      client: { id: "issues-web", name: "Issues Web" },
      requestedScope: ["openid", "offline"],
      requestUrl: "http://127.0.0.1:4444/oauth2/auth?...",
      loginChallenge: "login-challenge-1",
      loginSessionId: "login-session-1",
    };
    const getConsentChallenge = vi.fn().mockResolvedValue(challenge);
    get.mockReturnValue({ getConsentChallenge });

    const response = await consent.handler(
      httpRequest({
        query: { consent_challenge: "consent-challenge-1" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.OAuthService);
    expect(getConsentChallenge).toHaveBeenCalledWith("consent-challenge-1");
    expect(response).toEqual({
      status: 200,
      body: challenge,
    });
  });

  it("accepts a consent challenge with granted scopes and returns redirectTo", async () => {
    const acceptConsentFn = vi.fn().mockResolvedValue({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?consent_verifier=abc",
    });
    get.mockReturnValue({ acceptConsent: acceptConsentFn });

    const response = await acceptConsent.handler(
      httpRequest({
        method: "POST",
        query: { consent_challenge: "consent-challenge-1" },
        body: { grantScope: ["openid", "offline"], remember: true, rememberFor: 3600 },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.OAuthService);
    expect(acceptConsentFn).toHaveBeenCalledWith({
      challenge: "consent-challenge-1",
      grantScope: ["openid", "offline"],
      remember: true,
      rememberFor: 3600,
    });
    expect(response).toEqual({
      status: 200,
      body: {
        redirectTo: "http://127.0.0.1:4444/oauth2/auth?consent_verifier=abc",
      },
    });
    expect(acceptConsent.method).toBe("POST");
    expect(acceptConsent.url).toBe("/identity/oauth/consent/accept");
  });

  it("rejects a consent challenge when the user denies consent and returns redirectTo", async () => {
    const rejectConsentFn = vi.fn().mockResolvedValue({
      redirectTo: "http://127.0.0.1:4444/oauth2/auth?error=access_denied",
    });
    get.mockReturnValue({ rejectConsent: rejectConsentFn });

    const response = await rejectConsent.handler(
      httpRequest({
        method: "POST",
        query: { consent_challenge: "consent-challenge-1" },
        body: { error: "access_denied", errorDescription: "User denied consent" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.OAuthService);
    expect(rejectConsentFn).toHaveBeenCalledWith({
      challenge: "consent-challenge-1",
      error: "access_denied",
      errorDescription: "User denied consent",
    });
    expect(response).toEqual({
      status: 200,
      body: {
        redirectTo: "http://127.0.0.1:4444/oauth2/auth?error=access_denied",
      },
    });
    expect(rejectConsent.method).toBe("POST");
    expect(rejectConsent.url).toBe("/identity/oauth/consent/reject");
  });

  it("returns not found when the consent_challenge is unknown", async () => {
    const getConsentChallenge = vi.fn().mockRejectedValue(new OAuthRequestNotFoundError());
    get.mockReturnValue({ getConsentChallenge });

    await expect(
      consent.handler(
        httpRequest({
          query: { consent_challenge: "missing" },
        }),
      ),
    ).rejects.toBeInstanceOf(OAuthRequestNotFoundError);
  });
});

describe("token route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("is a POST endpoint for exchanging an authorization code", () => {
    expect(token.method).toBe("POST");
    expect(token.url).toBe("/identity/oauth/token");
    expect(token.schema).toMatchObject({
      body: expect.anything(),
    });
  });

  it("exchanges a code via the OAuth service and sets tokens as HTTP-only cookies", async () => {
    const exchangeToken = vi.fn().mockResolvedValue({
      accessToken: "access-1",
      tokenType: "bearer",
      expiresIn: 3600,
      refreshToken: "refresh-1",
      idToken: "id-1",
      scope: "openid offline",
    });
    get.mockReturnValue({ exchangeToken });

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

    expect(get).toHaveBeenCalledWith(TYPES.OAuthService);
    expect(exchangeToken).toHaveBeenCalledWith({
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

  it("propagates InvalidOAuthRequestError from the OAuth service", async () => {
    const exchangeToken = vi.fn().mockRejectedValue(new InvalidOAuthRequestError());
    get.mockReturnValue({ exchangeToken });

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

describe("OAuth introspect/revoke routes", () => {
  it.todo("introspects a bearer token and returns active status and claims");

  it.todo("revokes a token and returns success");
});
