import { inject, injectable } from "inversify";
import type { OAuth2Client } from "@ory/hydra-client";
import { TYPES } from "@/bootstrap/container-types";
import type {
  IOAuthClientProvider,
  RegisteredOAuthClient,
  RegisterOAuthClientInput,
} from "@/integrations/oauth/IOAuthClientProvider";
import type { HydraClient } from "@/integrations/oauth/ory-hydra/HydraClient";
import { getHydraHttpStatus, rethrowHydraError } from "@/integrations/oauth/ory-hydra/utils";

@injectable()
export class HydraOAuthClientProvider implements IOAuthClientProvider {
  constructor(
    @inject(TYPES.HydraClient)
    private readonly hydra: HydraClient,
  ) {}

  async registerClient(input: RegisterOAuthClientInput): Promise<RegisteredOAuthClient> {
    try {
      const { data } = await this.hydra.adminApi.createOAuth2Client({
        oAuth2Client: this.toHydraClient(input),
      });

      return this.mapRegisteredClient(data, input.clientId);
    } catch (error) {
      throw rethrowHydraError(error);
    }
  }

  async updateClient(input: RegisterOAuthClientInput): Promise<RegisteredOAuthClient> {
    try {
      const { data } = await this.hydra.adminApi.setOAuth2Client({
        id: input.clientId,
        oAuth2Client: this.toHydraClient(input),
      });

      return this.mapRegisteredClient(data, input.clientId);
    } catch (error) {
      throw rethrowHydraError(error);
    }
  }

  async getClient(clientId: string): Promise<RegisteredOAuthClient | null> {
    try {
      const { data } = await this.hydra.adminApi.getOAuth2Client({ id: clientId });
      return this.mapRegisteredClient(data, clientId);
    } catch (error) {
      if (getHydraHttpStatus(error) === 404) {
        return null;
      }
      throw rethrowHydraError(error);
    }
  }

  async deleteClient(providerClientId: string): Promise<void> {
    try {
      await this.hydra.adminApi.deleteOAuth2Client({ id: providerClientId });
    } catch (error) {
      if (getHydraHttpStatus(error) === 404) {
        return;
      }
      throw rethrowHydraError(error);
    }
  }

  private toHydraClient(input: RegisterOAuthClientInput): OAuth2Client {
    const tokenEndpointAuthMethod = input.tokenEndpointAuthMethod ?? "none";
    const responseTypes = input.grantTypes.includes("authorization_code") ? ["code"] : [];

    return {
      client_id: input.clientId,
      client_name: input.name,
      redirect_uris: input.redirectUris,
      grant_types: input.grantTypes,
      response_types: responseTypes,
      scope: input.scopes.join(" "),
      token_endpoint_auth_method: tokenEndpointAuthMethod,
      ...(input.clientSecret !== undefined ? { client_secret: input.clientSecret } : {}),
    };
  }

  private mapRegisteredClient(data: OAuth2Client, fallbackClientId: string): RegisteredOAuthClient {
    return {
      clientId: data.client_id ?? fallbackClientId,
      name: data.client_name,
      redirectUris: data.redirect_uris,
      grantTypes: data.grant_types,
      scopes: data.scope?.split(/\s+/).filter(Boolean),
      clientSecret: data.client_secret,
    };
  }
}
