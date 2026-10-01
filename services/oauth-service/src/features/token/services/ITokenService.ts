export interface ExchangeOptions {
  grantType: "authorization_code";
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}

export interface ExchangeResult {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  refreshToken?: string;
  idToken?: string;
  scope?: string;
}

export interface IntrospectOptions {
  token: string;
  scope?: string;
}

export interface IntrospectResult {
  active: boolean;
  subject?: string;
  clientId?: string;
  scope?: string;
  expiresAt?: Date;
  issuedAt?: Date;
  audience?: string[];
  extra?: Record<string, unknown>;
}

export interface ITokenService {
  exchange(params: ExchangeOptions): Promise<ExchangeResult>;
  introspect(params: IntrospectOptions): Promise<IntrospectResult>;
}
