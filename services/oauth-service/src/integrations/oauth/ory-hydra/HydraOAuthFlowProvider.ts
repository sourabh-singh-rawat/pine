import { inject, injectable } from "inversify";
import type { OAuth2Client } from "@ory/hydra-client";
import { env } from "@/bootstrap/env";
import { TYPES } from "@/bootstrap/container-types";
import type {
  AcceptConsentInput,
  AcceptLoginInput,
  ConsentChallenge,
  ForwardAuthorizationInput,
  ForwardAuthorizationResult,
  IOAuthFlowProvider,
  LoginChallenge,
  OAuthClientInfo,
  OAuthRedirectResult,
  OAuthSetCookie,
  RejectRequestInput,
} from "@/integrations/oauth/IOAuthFlowProvider";
import type { HydraClient } from "@/integrations/oauth/ory-hydra/HydraClient";
import { parseSetCookieHeader } from "@/integrations/oauth/ory-hydra/parseSetCookieHeader";
import { rewriteHydraPublicUrl } from "@/integrations/oauth/ory-hydra/rewriteHydraPublicUrl";
import { rethrowHydraError } from "@/integrations/oauth/ory-hydra/rethrowHydraError";
import { OAuthProviderUnavailableError } from "@/integrations/oauth/errors";

@injectable()
export class HydraOAuthFlowProvider implements IOAuthFlowProvider {
  constructor(
    @inject(TYPES.HydraClient)
    private readonly hydra: HydraClient,
  ) {}

  async forwardAuthorization(
    input: ForwardAuthorizationInput,
  ): Promise<ForwardAuthorizationResult> {
    const search =
      input.search.startsWith("?") || input.search.length === 0 ? input.search : `?${input.search}`;
    const target = new URL(`/oauth2/auth${search}`, this.hydra.publicUrl);

    let response: Response;
    try {
      response = await fetch(target, {
        method: "GET",
        redirect: "manual",
        headers: input.cookieHeader ? { cookie: input.cookieHeader } : undefined,
      });
    } catch {
      throw new OAuthProviderUnavailableError();
    }

    const locationHeader = response.headers.get("location") ?? undefined;
    const location = locationHeader ? this.rewritePublicRedirect(locationHeader) : undefined;

    const cookies = this.readSetCookies(response.headers);
    const body = await response.text();

    return {
      status: response.status,
      ...(location ? { location } : {}),
      cookies,
      ...(body.length > 0 ? { body } : {}),
    };
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

      return { redirectTo: this.rewritePublicRedirect(data.redirect_to) };
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

      return { redirectTo: this.rewritePublicRedirect(data.redirect_to) };
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

      return { redirectTo: this.rewritePublicRedirect(data.redirect_to) };
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

      return { redirectTo: this.rewritePublicRedirect(data.redirect_to) };
    } catch (error) {
      rethrowHydraError(error);
    }
  }

  private rewritePublicRedirect(redirectTo: string): string {
    return rewriteHydraPublicUrl(redirectTo, this.hydra.publicUrl, env.OAUTH_PUBLIC_URL);
  }

  private readSetCookies(headers: Headers): OAuthSetCookie[] {
    const rawCookies = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
    const publicIsHttps = env.OAUTH_PUBLIC_URL.startsWith("https:");

    const cookies: OAuthSetCookie[] = [];
    for (const header of rawCookies) {
      const parsed = parseSetCookieHeader(header);
      if (!parsed) {
        continue;
      }
      if (publicIsHttps) {
        parsed.secure = true;
      }
      cookies.push(parsed);
    }
    return cookies;
  }

  private mapClient(client?: OAuth2Client): OAuthClientInfo {
    return {
      id: client?.client_id ?? "",
      name: client?.client_name,
      redirectUris: client?.redirect_uris,
    };
  }
}
