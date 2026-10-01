import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type {
  ExchangeOptions,
  ExchangeResult,
  IntrospectOptions,
  IntrospectResult,
  ITokenService,
} from "@/features/token/services/ITokenService";
import type { IOAuthTokenProvider } from "@/integrations/oauth";

@injectable()
export class TokenService implements ITokenService {
  constructor(
    @inject(TYPES.OAuthTokenProvider)
    private readonly oauthTokenProvider: IOAuthTokenProvider,
  ) {}

  async exchange(params: ExchangeOptions): Promise<ExchangeResult> {
    return this.oauthTokenProvider.exchangeToken({
      grantType: params.grantType,
      clientId: params.clientId,
      code: params.code,
      redirectUri: params.redirectUri,
      codeVerifier: params.codeVerifier,
    });
  }

  async introspect(params: IntrospectOptions): Promise<IntrospectResult> {
    return this.oauthTokenProvider.introspectToken(params.token, params.scope);
  }
}
