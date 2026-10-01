import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { acceptConsent } from "@/features/consent/routes/acceptConsent";
import { consent } from "@/features/consent/routes/consent";
import { rejectConsent } from "@/features/consent/routes/rejectConsent";
import { InvalidOAuthRequestError, OAuthRequestNotFoundError } from "@/integrations/oauth/errors";

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

describe("consent routes", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("is a GET endpoint that accepts a consent_challenge query param", () => {
    expect(consent.method).toBe("GET");
    expect(consent.url).toBe("/oauth/consent");
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
      loginChallenge: "login-challenge-1",
      loginSessionId: "login-session-1",
    };
    const getChallenge = vi.fn().mockResolvedValue(challenge);
    get.mockReturnValue({ getChallenge });

    const response = await consent.handler(
      httpRequest({
        query: { consent_challenge: "consent-challenge-1" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.ConsentService);
    expect(getChallenge).toHaveBeenCalledWith("consent-challenge-1");
    expect(response).toEqual({
      status: 200,
      body: challenge,
    });
  });

  it("accepts a consent challenge with granted scopes and returns redirectTo", async () => {
    const accept = vi.fn().mockResolvedValue({
      redirectTo: "https://localhost/api/oauth/authorize?consent_verifier=abc",
    });
    get.mockReturnValue({ accept });

    const response = await acceptConsent.handler(
      httpRequest({
        method: "POST",
        query: { consent_challenge: "consent-challenge-1" },
        body: { grantScope: ["openid", "offline"], remember: true, rememberFor: 3600 },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.ConsentService);
    expect(accept).toHaveBeenCalledWith({
      challenge: "consent-challenge-1",
      grantScope: ["openid", "offline"],
      remember: true,
      rememberFor: 3600,
    });
    expect(response).toEqual({
      status: 200,
      body: {
        redirectTo: "https://localhost/api/oauth/authorize?consent_verifier=abc",
      },
    });
    expect(acceptConsent.method).toBe("POST");
    expect(acceptConsent.url).toBe("/oauth/consent/accept");
  });

  it("rejects a consent challenge when the user denies consent and returns redirectTo", async () => {
    const reject = vi.fn().mockResolvedValue({
      redirectTo: "https://localhost/api/oauth/authorize?error=access_denied",
    });
    get.mockReturnValue({ reject });

    const response = await rejectConsent.handler(
      httpRequest({
        method: "POST",
        query: { consent_challenge: "consent-challenge-1" },
        body: { error: "access_denied", errorDescription: "User denied consent" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.ConsentService);
    expect(reject).toHaveBeenCalledWith({
      challenge: "consent-challenge-1",
      error: "access_denied",
      errorDescription: "User denied consent",
    });
    expect(response).toEqual({
      status: 200,
      body: {
        redirectTo: "https://localhost/api/oauth/authorize?error=access_denied",
      },
    });
    expect(rejectConsent.method).toBe("POST");
    expect(rejectConsent.url).toBe("/oauth/consent/reject");
  });

  it("rejects missing consent_challenge query parameters", async () => {
    await expect(consent.handler(httpRequest({ query: {} }))).rejects.toBeInstanceOf(
      InvalidOAuthRequestError,
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects invalid accept consent body", async () => {
    await expect(
      acceptConsent.handler(
        httpRequest({
          method: "POST",
          query: { consent_challenge: "consent-challenge-1" },
          body: { grantScope: [] },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects invalid reject consent body", async () => {
    await expect(
      rejectConsent.handler(
        httpRequest({
          method: "POST",
          query: { consent_challenge: "consent-challenge-1" },
          body: { error: "" },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
    expect(get).not.toHaveBeenCalled();
  });

  it("returns not found when the consent_challenge is unknown", async () => {
    const getChallenge = vi.fn().mockRejectedValue(new OAuthRequestNotFoundError());
    get.mockReturnValue({ getChallenge });

    await expect(
      consent.handler(
        httpRequest({
          query: { consent_challenge: "missing" },
        }),
      ),
    ).rejects.toBeInstanceOf(OAuthRequestNotFoundError);
  });
});
