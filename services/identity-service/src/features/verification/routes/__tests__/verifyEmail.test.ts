import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { verifyEmail } from "@/features/verification/routes/verifyEmail";

function httpRequest(partial: Partial<HttpRequest>): HttpRequest {
  return {
    method: partial.method ?? "GET",
    url: partial.url ?? "/identity/verifyEmail",
    headers: partial.headers ?? {},
    query: partial.query ?? {},
    params: partial.params ?? {},
    cookies: partial.cookies ?? {},
    body: partial.body,
    file: partial.file ?? (async () => undefined),
  };
}

describe("verifyEmail route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("verifies email and returns 200", async () => {
    const verifyEmailFn = vi.fn().mockResolvedValue(undefined);
    get.mockReturnValue({ verifyEmail: verifyEmailFn });

    const response = await verifyEmail.handler(
      httpRequest({
        query: { flow: "flow-1", code: "123456" },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.VerificationService);
    expect(verifyEmailFn).toHaveBeenCalledWith({
      flowId: "flow-1",
      code: "123456",
    });
    expect(response).toEqual({
      status: 200,
      body: {
        message: "Email verified successfully.",
      },
    });
  });
});
