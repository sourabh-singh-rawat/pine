import { inject, injectable } from "inversify";
import axios from "axios";
import { TYPES } from "@/bootstrap/container-types";
import type {
  ExchangeTokenInput,
  IntrospectTokenResult,
  IOAuthTokenProvider,
  TokenResult,
} from "@/integrations/oauth/IOAuthTokenProvider";
import type { HydraClient } from "@/integrations/oauth/ory-hydra/HydraClient";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";
import { rethrowHydraError } from "@/integrations/oauth/ory-hydra/rethrowHydraError";

@injectable()
export class HydraOAuthTokenProvider implements IOAuthTokenProvider {
  constructor(
    @inject(TYPES.HydraClient)
    private readonly hydra: HydraClient,
  ) {}

  async exchangeToken(input: ExchangeTokenInput): Promise<TokenResult> {
    const form = new URLSearchParams();
    form.set("grant_type", input.grantType);
    form.set("client_id", input.clientId);
    form.set("code", input.code);
    form.set("redirect_uri", input.redirectUri);
    form.set("code_verifier", input.codeVerifier);
    if (input.clientSecret) {
      form.set("client_secret", input.clientSecret);
    }

    try {
      const { data } = await axios.post<{
        access_token?: string;
        token_type?: string;
        expires_in?: number;
        refresh_token?: string;
        id_token?: string;
        scope?: string;
      }>(`${this.hydra.publicUrl}/oauth2/token`, form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        validateStatus: (status) => status >= 200 && status < 300,
      });

      if (!data.access_token || !data.token_type) {
        throw new InvalidOAuthRequestError("Token response missing access_token or token_type");
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        refreshToken: data.refresh_token,
        idToken: data.id_token,
        scope: data.scope,
      };
    } catch (error) {
      if (error instanceof InvalidOAuthRequestError) {
        throw error;
      }
      throw rethrowHydraError(error);
    }
  }

  async introspectToken(token: string, scope?: string): Promise<IntrospectTokenResult> {
    try {
      const { data } = await this.hydra.adminApi.introspectOAuth2Token({
        token,
        scope,
      });

      return {
        active: data.active,
        subject: data.sub,
        clientId: data.client_id,
        scope: data.scope,
        expiresAt: data.exp != null ? new Date(data.exp * 1000) : undefined,
        issuedAt: data.iat != null ? new Date(data.iat * 1000) : undefined,
        audience: data.aud,
        extra: isRecord(data.ext) ? data.ext : undefined,
      };
    } catch (error) {
      throw rethrowHydraError(error);
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await this.hydra.publicApi.revokeOAuth2Token({ token });
    } catch (error) {
      throw rethrowHydraError(error);
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
