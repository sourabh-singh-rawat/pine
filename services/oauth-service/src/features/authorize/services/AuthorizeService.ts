import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type {
  AuthorizeOptions,
  AuthorizeResult,
  IAuthorizeService,
} from "@/features/authorize/services/IAuthorizeService";
import type { IOAuthFlowProvider } from "@/integrations/oauth";

@injectable()
export class AuthorizeService implements IAuthorizeService {
  constructor(
    @inject(TYPES.OAuthFlowProvider)
    private readonly oauthFlowProvider: IOAuthFlowProvider,
  ) {}

  async authorize(params: AuthorizeOptions): Promise<AuthorizeResult> {
    const redirectTo = this.oauthFlowProvider.getAuthorizationUrl({
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      responseType: params.responseType,
      scope: params.scope,
      state: params.state,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      nonce: params.nonce,
    });

    return { redirectTo };
  }
}
