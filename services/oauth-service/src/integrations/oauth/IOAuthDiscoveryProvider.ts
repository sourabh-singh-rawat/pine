export type OpenIdConfiguration = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  introspection_endpoint: string;
  [key: string]: unknown;
};

export type JsonWebKeySet = {
  keys: Record<string, unknown>[];
};

export interface IOAuthDiscoveryProvider {
  getOpenIdConfiguration: () => Promise<OpenIdConfiguration>;
  getJwks: () => Promise<JsonWebKeySet>;
}
