import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { IDiscoveryService } from "@/features/discovery/services/IDiscoveryService";
import type {
  IOAuthDiscoveryProvider,
  JsonWebKeySet,
  OpenIdConfiguration,
} from "@/integrations/oauth/IOAuthDiscoveryProvider";

@injectable()
export class DiscoveryService implements IDiscoveryService {
  constructor(
    @inject(TYPES.OAuthDiscoveryProvider)
    private readonly oauthDiscoveryProvider: IOAuthDiscoveryProvider,
  ) {}

  async getOpenIdConfiguration(): Promise<OpenIdConfiguration> {
    return this.oauthDiscoveryProvider.getOpenIdConfiguration();
  }

  async getJwks(): Promise<JsonWebKeySet> {
    return this.oauthDiscoveryProvider.getJwks();
  }
}
