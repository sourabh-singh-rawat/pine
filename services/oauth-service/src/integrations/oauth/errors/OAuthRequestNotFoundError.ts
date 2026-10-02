import { ApplicationError } from "@pine/errors";
import { OAuthErrorCodes } from "@/integrations/oauth/errors/OAuthErrorCodes";

export class OAuthRequestNotFoundError extends ApplicationError {
  constructor(message = "OAuth request not found") {
    super(OAuthErrorCodes.OAUTH_REQUEST_NOT_FOUND, message, true);
  }
}
