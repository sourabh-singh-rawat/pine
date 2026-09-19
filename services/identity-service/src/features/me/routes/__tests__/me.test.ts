import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { me } from "@/features/me/routes/me";
import { InvalidCredentialError } from "@/integrations/identity";

function httpRequest(partial: Partial<HttpRequest>): HttpRequest {
  return {
    method: partial.method ?? "GET",
    url: partial.url ?? "/identity/me",
    headers: partial.headers ?? {},
    query: partial.query ?? {},
    params: partial.params ?? {},
    cookies: partial.cookies ?? {},
    body: partial.body,
    file: partial.file ?? (async () => undefined),
  };
}

describe("me route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("returns the current user identity and profile for a valid session cookie", async () => {
    const getCurrentUser = vi.fn().mockResolvedValue({
      identity: {
        id: "identity-1",
        email: "a@b.com",
        emailVerified: true,
      },
      profile: {
        id: "profile-1",
        identityId: "identity-1",
        firstName: "Ada",
        middleName: null,
        lastName: "Lovelace",
        gender: "FEMALE",
        description: "Mathematician",
        photoUrl: "https://example.com/ada.jpg",
      },
    });
    get.mockReturnValue({ getCurrentUser });

    const response = await me.handler(
      httpRequest({
        cookies: { session: "session-token-1" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.MeService);
    expect(getCurrentUser).toHaveBeenCalledWith("session-token-1");
    expect(response).toEqual({
      status: 200,
      body: {
        identity: {
          id: "identity-1",
          email: "a@b.com",
          emailVerified: true,
        },
        profile: {
          id: "profile-1",
          identityId: "identity-1",
          firstName: "Ada",
          middleName: null,
          lastName: "Lovelace",
          fullName: "Ada Lovelace",
          gender: "FEMALE",
          description: "Mathematician",
          photoUrl: "https://example.com/ada.jpg",
        },
      },
    });
  });

  it("returns a null profile when the identity has none", async () => {
    const getCurrentUser = vi.fn().mockResolvedValue({
      identity: {
        id: "identity-1",
        email: "a@b.com",
        emailVerified: true,
      },
      profile: null,
    });
    get.mockReturnValue({ getCurrentUser });

    const response = await me.handler(
      httpRequest({
        cookies: { session: "session-token-1" },
      }),
    );

    expect(response).toEqual({
      status: 200,
      body: {
        identity: {
          id: "identity-1",
          email: "a@b.com",
          emailVerified: true,
        },
        profile: null,
      },
    });
  });

  it("throws InvalidCredentialError when the session cookie is missing", async () => {
    const getCurrentUser = vi.fn();
    get.mockReturnValue({ getCurrentUser });

    await expect(me.handler(httpRequest({ cookies: {} }))).rejects.toBeInstanceOf(
      InvalidCredentialError,
    );

    expect(getCurrentUser).not.toHaveBeenCalled();
  });
});
