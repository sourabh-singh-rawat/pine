import { inject, injectable } from "inversify";
import axios from "axios";
import { TYPES } from "@/bootstrap/container-types";
import { env } from "@/bootstrap/env";
import { OAuthProviderUnavailableError } from "@/integrations/oauth/errors";
import type {
  IOAuthDiscoveryProvider,
  JsonWebKeySet,
  OpenIdConfiguration,
} from "@/integrations/oauth/IOAuthDiscoveryProvider";
import {
  rethrowHydraError,
  rewriteOpenIdConfiguration,
} from "@/integrations/oauth/ory-hydra/utils";

@injectable()
export class HydraOAuthDiscoveryProvider implements IOAuthDiscoveryProvider {
  constructor(
    @inject(TYPES.HydraClient)
    private readonly hydra: { readonly publicUrl: string },
  ) {}

  async getOpenIdConfiguration(): Promise<OpenIdConfiguration> {
    try {
      const { data } = await axios.get<unknown>(
        `${this.hydra.publicUrl}/.well-known/openid-configuration`,
        {
          validateStatus: (status) => status >= 200 && status < 300,
        },
      );

      if (!isRecord(data)) {
        throw new OAuthProviderUnavailableError();
      }

      return rewriteOpenIdConfiguration(data, env.OAUTH_PUBLIC_URL);
    } catch (error) {
      if (error instanceof OAuthProviderUnavailableError) {
        throw error;
      }
      throw rethrowHydraError(error);
    }
  }

  async getJwks(): Promise<JsonWebKeySet> {
    try {
      const { data } = await axios.get<unknown>(`${this.hydra.publicUrl}/.well-known/jwks.json`, {
        validateStatus: (status) => status >= 200 && status < 300,
      });

      if (!isJsonWebKeySet(data)) {
        throw new OAuthProviderUnavailableError();
      }

      return data;
    } catch (error) {
      if (error instanceof OAuthProviderUnavailableError) {
        throw error;
      }
      throw rethrowHydraError(error);
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isJsonWebKeySet = (value: unknown): value is JsonWebKeySet => {
  if (!isRecord(value) || !Array.isArray(value.keys)) {
    return false;
  }
  return value.keys.every((key) => isRecord(key));
};
