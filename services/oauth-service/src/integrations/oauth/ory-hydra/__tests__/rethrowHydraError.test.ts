import { describe, expect, it } from "vitest";
import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
  OAuthRequestExpiredError,
  OAuthRequestNotFoundError,
} from "@/integrations/oauth/errors";
import {
  getHydraErrorDetails,
  getHydraHttpStatus,
  rethrowHydraError,
} from "@/integrations/oauth/ory-hydra/rethrowHydraError";

describe("rethrowHydraError", () => {
  it("extracts status code and error details from an Axios-like error", () => {
    const error = {
      response: {
        status: 401,
        data: {
          error: "request_unauthorized",
          error_description:
            "The request could not be authorized. The consent request has expired, please try again.",
        },
      },
    };

    expect(getHydraHttpStatus(error)).toBe(401);
    expect(getHydraErrorDetails(error)).toEqual({
      error: "request_unauthorized",
      error_description:
        "The request could not be authorized. The consent request has expired, please try again.",
    });
  });

  it("returns undefined for non-Axios errors", () => {
    expect(getHydraHttpStatus(new Error("fail"))).toBeUndefined();
    expect(getHydraErrorDetails(null)).toBeUndefined();
  });

  it("throws OAuthRequestExpiredError when error is request_unauthorized and description mentions expired", () => {
    const error = {
      response: {
        status: 401,
        data: {
          error: "request_unauthorized",
          error_description:
            "The request could not be authorized. The consent request has expired, please try again.",
        },
      },
    };

    expect(() => rethrowHydraError(error)).toThrowError(
      "The request could not be authorized. The consent request has expired, please try again.",
    );
    expect(() => rethrowHydraError(error)).toThrowError(OAuthRequestExpiredError);
  });

  it("throws InvalidOAuthRequestError when error is request_unauthorized without expired", () => {
    const error = {
      response: {
        status: 401,
        data: {
          error: "request_unauthorized",
          error_description: "The request could not be authorized.",
        },
      },
    };

    expect(() => rethrowHydraError(error)).toThrowError(InvalidOAuthRequestError);
  });

  it("throws InvalidOAuthRequestError on status 400", () => {
    const error = {
      response: {
        status: 400,
        data: { message: "Bad request payload" },
      },
    };

    expect(() => rethrowHydraError(error)).toThrowError(InvalidOAuthRequestError);
  });

  it("throws OAuthRequestNotFoundError on status 404", () => {
    const error = {
      response: {
        status: 404,
        data: { message: "Not found" },
      },
    };

    expect(() => rethrowHydraError(error)).toThrowError(OAuthRequestNotFoundError);
  });

  it("throws OAuthProviderUnavailableError on status 500 or undefined status", () => {
    const error500 = { response: { status: 500 } };
    expect(() => rethrowHydraError(error500)).toThrowError(OAuthProviderUnavailableError);

    const errorNetwork = new Error("Network Error");
    expect(() => rethrowHydraError(errorNetwork)).toThrowError(OAuthProviderUnavailableError);
  });
});
