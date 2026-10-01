import { ApplicationError } from "@pine/errors";
import { OAuthErrorCodes } from "@/integrations/oauth/errors/OAuthErrorCodes";

export class InvalidOAuthRequestError extends ApplicationError {
  constructor(message = "Invalid OAuth request") {
    super(OAuthErrorCodes.INVALID_OAUTH_REQUEST, message, true);
  }
}
