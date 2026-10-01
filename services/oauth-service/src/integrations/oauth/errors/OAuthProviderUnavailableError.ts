import { ApplicationError } from "@pine/errors";
import { OAuthErrorCodes } from "@/integrations/oauth/errors/OAuthErrorCodes";

export class OAuthProviderUnavailableError extends ApplicationError {
  constructor(message = "OAuth provider is unavailable") {
    super(OAuthErrorCodes.OAUTH_PROVIDER_UNAVAILABLE, message, false);
  }
}
