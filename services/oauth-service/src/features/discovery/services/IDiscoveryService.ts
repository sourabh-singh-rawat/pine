import type {
  JsonWebKeySet,
  OpenIdConfiguration,
} from "@/integrations/oauth/IOAuthDiscoveryProvider";

export interface IDiscoveryService {
  getOpenIdConfiguration: () => Promise<OpenIdConfiguration>;
  getJwks: () => Promise<JsonWebKeySet>;
}
