import { inject, injectable } from "inversify";
import type { OAuth2Client } from "@ory/hydra-client";
import { TYPES } from "@/bootstrap/container-types";
import type {
  AcceptConsentInput,
  AcceptLoginInput,
  AuthorizeInput,
  ConsentChallenge,
  IOAuthFlowProvider,
  LoginChallenge,
  OAuthClientInfo,
  OAuthRedirectResult,
  RejectRequestInput,
} from "@/integrations/oauth/IOAuthFlowProvider";
import type { HydraClient } from "@/integrations/oauth/ory-hydra/HydraClient";
import { rethrowHydraError } from "@/integrations/oauth/ory-hydra/rethrowHydraError";

@injectable()
export class HydraOAuthFlowProvider implements IOAuthFlowProvider {
  constructor(
    @inject(TYPES.HydraClient)
    private readonly hydra: HydraClient,
  ) {}

  getAuthorizationUrl(input: AuthorizeInput): string {
    const url = new URL("/oauth2/auth", this.hydra.publicUrl);
    url.searchParams.set("client_id", input.clientId);
    url.searchParams.set("redirect_uri", input.redirectUri);
    url.searchParams.set("response_type", input.responseType);
    url.searchParams.set("scope", input.scope);
    url.searchParams.set("state", input.state);

    if (input.codeChallenge) {
      url.searchParams.set("code_challenge", input.codeChallenge);
      url.searchParams.set("code_challenge_method", input.codeChallengeMethod ?? "S256");
    }
    if (input.nonce) {
      url.searchParams.set("nonce", input.nonce);
    }

    return url.toString();
  }

  async getLoginRequest(challenge: string): Promise<LoginChallenge> {
    try {
      const { data } = await this.hydra.adminApi.getOAuth2LoginRequest({
        loginChallenge: challenge,
      });

      return {
        challenge: data.challenge,
        skip: data.skip,
        subject: data.subject || undefined,
        client: this.mapClient(data.client),
        requestedScope: data.requested_scope ?? [],
        requestUrl: data.request_url,
        sessionId: data.session_id,
      };
    } catch (error) {
      rethrowHydraError(error);
    }
  }

  async acceptLoginRequest(input: AcceptLoginInput): Promise<OAuthRedirectResult> {
    try {
      const { data } = await this.hydra.adminApi.acceptOAuth2LoginRequest({
        loginChallenge: input.challenge,
        acceptOAuth2LoginRequest: {
          subject: input.subject,
          remember: input.remember,
          remember_for: input.rememberFor,
          identity_provider_session_id: input.identityProviderSessionId,
          context: input.context,
        },
      });

      return { redirectTo: data.redirect_to };
    } catch (error) {
      rethrowHydraError(error);
    }
  }

  async rejectLoginRequest(input: RejectRequestInput): Promise<OAuthRedirectResult> {
    try {
      const { data } = await this.hydra.adminApi.rejectOAuth2LoginRequest({
        loginChallenge: input.challenge,
        rejectOAuth2Request: {
          error: input.error,
          error_description: input.errorDescription,
        },
      });

      return { redirectTo: data.redirect_to };
    } catch (error) {
      rethrowHydraError(error);
    }
  }

  async getConsentRequest(challenge: string): Promise<ConsentChallenge> {
    try {
      const { data } = await this.hydra.adminApi.getOAuth2ConsentRequest({
        consentChallenge: challenge,
      });

      return {
        challenge: data.challenge,
        skip: data.skip ?? false,
        subject: data.subject,
        client: this.mapClient(data.client),
        requestedScope: data.requested_scope ?? [],
        requestUrl: data.request_url,
        loginChallenge: data.login_challenge,
        loginSessionId: data.login_session_id,
      };
    } catch (error) {
      rethrowHydraError(error);
    }
  }

  async acceptConsentRequest(input: AcceptConsentInput): Promise<OAuthRedirectResult> {
    try {
      const { data } = await this.hydra.adminApi.acceptOAuth2ConsentRequest({
        consentChallenge: input.challenge,
        acceptOAuth2ConsentRequest: {
          grant_scope: input.grantScope,
          remember: input.remember,
          remember_for: input.rememberFor,
          session: {
            access_token: input.accessTokenExtra,
            id_token: input.idTokenExtra,
          },
        },
      });

      return { redirectTo: data.redirect_to };
    } catch (error) {
      rethrowHydraError(error);
    }
  }

  async rejectConsentRequest(input: RejectRequestInput): Promise<OAuthRedirectResult> {
    try {
      const { data } = await this.hydra.adminApi.rejectOAuth2ConsentRequest({
        consentChallenge: input.challenge,
        rejectOAuth2Request: {
          error: input.error,
          error_description: input.errorDescription,
        },
      });

      return { redirectTo: data.redirect_to };
    } catch (error) {
      rethrowHydraError(error);
    }
  }

  private mapClient(client?: OAuth2Client): OAuthClientInfo {
    return {
      id: client?.client_id ?? "",
      name: client?.client_name,
      redirectUris: client?.redirect_uris,
    };
  }
}
