import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type {
  AcceptOptions,
  ConsentActionResult,
  ConsentChallengeResult,
  IConsentService,
  RejectOptions,
} from "@/features/consent/services/IConsentService";
import { resolveConsentScopes } from "@/features/consent/utils";
import type { IOAuthFlowProvider } from "@/integrations/oauth";

@injectable()
export class ConsentService implements IConsentService {
  constructor(
    @inject(TYPES.OAuthFlowProvider)
    private readonly oauthFlowProvider: IOAuthFlowProvider,
  ) {}

  async getChallenge(challenge: string): Promise<ConsentChallengeResult> {
    const consentRequest = await this.oauthFlowProvider.getConsentRequest(challenge);
    return {
      ...consentRequest,
      scopes: resolveConsentScopes(consentRequest.requestedScope),
    };
  }

  async accept(params: AcceptOptions): Promise<ConsentActionResult> {
    return this.oauthFlowProvider.acceptConsentRequest({
      challenge: params.challenge,
      grantScope: params.grantScope,
      remember: params.remember,
      rememberFor: params.rememberFor,
    });
  }

  async reject(params: RejectOptions): Promise<ConsentActionResult> {
    return this.oauthFlowProvider.rejectConsentRequest({
      challenge: params.challenge,
      error: params.error,
      errorDescription: params.errorDescription,
    });
  }
}
