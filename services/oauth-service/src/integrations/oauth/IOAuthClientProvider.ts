export interface RegisterOAuthClientInput {
  clientId: string;
  name: string;
  redirectUris: string[];
  grantTypes: string[];
  scopes: string[];
  tokenEndpointAuthMethod?:
    | "none"
    | "client_secret_basic"
    | "client_secret_post"
    | "private_key_jwt";
  clientSecret?: string;
}

export interface RegisteredOAuthClient {
  clientId: string;
  name?: string;
  redirectUris?: string[];
  grantTypes?: string[];
  scopes?: string[];
  clientSecret?: string;
}

export interface IOAuthClientProvider {
  registerClient(input: RegisterOAuthClientInput): Promise<RegisteredOAuthClient>;
  updateClient(input: RegisterOAuthClientInput): Promise<RegisteredOAuthClient>;
  getClient(clientId: string): Promise<RegisteredOAuthClient | null>;
  deleteClient(providerClientId: string): Promise<void>;
}
