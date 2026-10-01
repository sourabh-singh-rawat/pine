export interface ExchangeTokenInput {
  grantType: "authorization_code";
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
  clientSecret?: string;
}

export interface TokenResult {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  refreshToken?: string;
  idToken?: string;
  scope?: string;
}

export interface IntrospectTokenResult {
  active: boolean;
  subject?: string;
  clientId?: string;
  scope?: string;
  expiresAt?: Date;
  issuedAt?: Date;
  audience?: string[];
  extra?: Record<string, unknown>;
}

export interface IOAuthTokenProvider {
  exchangeToken(input: ExchangeTokenInput): Promise<TokenResult>;
  introspectToken(token: string, scope?: string): Promise<IntrospectTokenResult>;
  revokeToken(token: string): Promise<void>;
}
