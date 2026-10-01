import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type {
  AcceptOptions,
  AcceptResult,
  ILoginService,
} from "@/features/login/services/ILoginService";
import type { IOAuthFlowProvider } from "@/integrations/oauth";

@injectable()
export class LoginService implements ILoginService {
  constructor(
    @inject(TYPES.OAuthFlowProvider)
    private readonly oauthFlowProvider: IOAuthFlowProvider,
  ) {}

  async accept(params: AcceptOptions): Promise<AcceptResult> {
    return this.oauthFlowProvider.acceptLoginRequest({
      challenge: params.challenge,
      subject: params.subject,
      remember: params.remember,
      rememberFor: params.rememberFor,
      identityProviderSessionId: params.identityProviderSessionId,
    });
  }
}
