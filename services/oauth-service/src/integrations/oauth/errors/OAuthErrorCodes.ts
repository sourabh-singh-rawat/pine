export const OAuthErrorCodes = {
  OAUTH_PROVIDER_UNAVAILABLE: "OAUTH_PROVIDER_UNAVAILABLE",
  OAUTH_REQUEST_NOT_FOUND: "OAUTH_REQUEST_NOT_FOUND",
  INVALID_OAUTH_REQUEST: "INVALID_OAUTH_REQUEST",
} as const;

export type OAuthErrorCode = (typeof OAuthErrorCodes)[keyof typeof OAuthErrorCodes];
