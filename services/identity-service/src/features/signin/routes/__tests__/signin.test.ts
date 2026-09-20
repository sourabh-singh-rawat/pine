import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { signin } from "@/features/signin/routes/signin";

const httpRequest = (partial: Partial<HttpRequest>): HttpRequest => ({
  method: partial.method ?? "POST",
  url: partial.url ?? "/identity/signin",
  headers: partial.headers ?? {},
  query: partial.query ?? {},
  params: partial.params ?? {},
  cookies: partial.cookies ?? {},
  body: partial.body,
  file: partial.file ?? (async () => undefined),
});

describe("signin route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("sets the session cookie and returns 200 with identity", async () => {
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");
    const signInWithEmailAndPassword = vi.fn().mockResolvedValue({
      identity: {
        id: "identity-1",
        email: "a@b.com",
        emailVerified: true,
      },
      sessionToken: "session-token-1",
      expiresAt,
      sessionId: "session-1",
    });

    get.mockReturnValue({ signInWithEmailAndPassword });

    const response = await signin.handler(
      httpRequest({
        body: { email: "a@b.com", password: "password" },
        query: {},
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.SignInService);
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "password",
      loginChallenge: undefined,
    });
    expect(response).toEqual({
      status: 200,
      body: {
        data: {
          identity: {
            id: "identity-1",
            email: "a@b.com",
            emailVerified: true,
          },
        },
      },
      cookies: [
        {
          name: "session",
          value: "session-token-1",
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: true,
          expires: expiresAt,
        },
      ],
    });
  });

  it("passes login_challenge and returns redirectTo in JSON (no HTTP 302)", async () => {
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");
    const redirectTo = "http://127.0.0.1:4444/oauth2/auth?login_verifier=abc";
    const signInWithEmailAndPassword = vi.fn().mockResolvedValue({
      identity: {
        id: "identity-1",
        email: "a@b.com",
        emailVerified: true,
      },
      sessionToken: "session-token-1",
      expiresAt,
      sessionId: "session-1",
      redirectTo,
    });

    get.mockReturnValue({ signInWithEmailAndPassword });

    const response = await signin.handler(
      httpRequest({
        body: {
          email: "a@b.com",
          password: "password",
        },
        query: {
          login_challenge: "login-challenge-1",
        },
      }),
    );

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "password",
      loginChallenge: "login-challenge-1",
    });
    expect(response).toEqual({
      status: 200,
      body: {
        data: {
          identity: {
            id: "identity-1",
            email: "a@b.com",
            emailVerified: true,
          },
          redirectTo,
        },
      },
      cookies: [
        {
          name: "session",
          value: "session-token-1",
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: true,
          expires: expiresAt,
        },
      ],
    });
  });
});
