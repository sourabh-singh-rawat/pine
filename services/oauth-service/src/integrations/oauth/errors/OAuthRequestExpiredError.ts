import { ResponseError } from "@pine/common";
import { StatusCodes } from "http-status-codes";
import { OAuthErrorCodes } from "@/integrations/oauth/errors/OAuthErrorCodes";

const DEFAULT_EXPIRED_MESSAGE =
  "The request could not be authorized. The consent request has expired, please try again.";

export class OAuthRequestExpiredError extends ResponseError {
  readonly code = OAuthErrorCodes.OAUTH_REQUEST_EXPIRED;

  constructor(message = DEFAULT_EXPIRED_MESSAGE) {
    super(message, StatusCodes.GONE);
  }
}
