import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
  OAuthRequestExpiredError,
  OAuthRequestNotFoundError,
} from "@/integrations/oauth/errors";

type HydraErrorData = {
  error?: string;
  error_description?: string;
  message?: string;
};

type HydraAxiosLikeError = {
  response?: {
    status?: number;
    data?: HydraErrorData;
  };
};

const isHydraAxiosLikeError = (error: unknown): error is HydraAxiosLikeError =>
  typeof error === "object" && error !== null && "response" in error;

export const getHydraHttpStatus = (error: unknown): number | undefined => {
  if (!isHydraAxiosLikeError(error)) {
    return undefined;
  }
  return error.response?.status;
};

export const getHydraErrorDetails = (error: unknown): HydraErrorData | undefined => {
  if (!isHydraAxiosLikeError(error)) {
    return undefined;
  }
  return error.response?.data;
};

export const rethrowHydraError = (error: unknown): never => {
  const status = getHydraHttpStatus(error);
  const details = getHydraErrorDetails(error);
  const description = details?.error_description ?? details?.message;
  const isUnauthorized = details?.error === "request_unauthorized" || status === 401;
  const isExpired = description?.toLowerCase().includes("expired") ?? false;

  if (isUnauthorized && isExpired) {
    throw new OAuthRequestExpiredError(
      description ??
        "The request could not be authorized. The consent request has expired, please try again.",
    );
  }

  if (isUnauthorized) {
    throw new InvalidOAuthRequestError(description ?? "Request unauthorized");
  }

  switch (status) {
    case 400:
    case 403:
      throw new InvalidOAuthRequestError(description);
    case 404:
      throw new OAuthRequestNotFoundError(description);
    default:
      if (status === undefined || status >= 500) {
        throw new OAuthProviderUnavailableError();
      }
      throw error;
  }
};
