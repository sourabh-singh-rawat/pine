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
    return this.oauthFlowProvider.forwardAuthorization({
      search: params.search,
      cookieHeader: params.cookieHeader,
    });
  }
}
