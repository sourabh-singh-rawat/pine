import {
  InvalidOAuthRequestError,
  OAuthProviderUnavailableError,
  OAuthRequestNotFoundError,
} from "@/integrations/oauth/errors";

export function getHydraHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }
  return (error as { response?: { status?: number } }).response?.status;
}

export function rethrowHydraError(error: unknown): never {
  const status = getHydraHttpStatus(error);

  switch (status) {
    case 400:
    case 401:
    case 403:
      throw new InvalidOAuthRequestError();
    case 404:
      throw new OAuthRequestNotFoundError();
    default:
      if (status === undefined || status >= 500) {
        throw new OAuthProviderUnavailableError();
      }
      throw error;
  }
}
