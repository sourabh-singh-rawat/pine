export const ClientErrorCodes = {
  INVALID_CREATE_CLIENT_BODY: "INVALID_CREATE_CLIENT_BODY",
  CLIENT_NOT_FOUND: "CLIENT_NOT_FOUND",
} as const;

export type ClientErrorCode = (typeof ClientErrorCodes)[keyof typeof ClientErrorCodes];
