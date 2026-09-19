import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { resendVerificationEmail } from "@/features/verification/routes/resendVerificationEmail";

function httpRequest(partial: Partial<HttpRequest>): HttpRequest {
  return {
    method: partial.method ?? "POST",
    url: partial.url ?? "/identity/resendVerificationEmail",
    headers: partial.headers ?? {},
    query: partial.query ?? {},
    params: partial.params ?? {},
    cookies: partial.cookies ?? {},
    body: partial.body,
    file: partial.file ?? (async () => undefined),
  };
}

describe("resendVerificationEmail route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("requests a resend and returns 200 with a generic message", async () => {
    const resendVerificationEmailFn = vi.fn().mockResolvedValue(undefined);
    get.mockReturnValue({ resendVerificationEmail: resendVerificationEmailFn });

    const response = await resendVerificationEmail.handler(
      httpRequest({
        body: { email: "a@b.com" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.VerificationService);
    expect(resendVerificationEmailFn).toHaveBeenCalledWith({
      email: "a@b.com",
    });
    expect(response).toEqual({
      status: 200,
      body: {
        message: "If an account exists for that email, a verification email has been sent.",
      },
    });
  });
});
