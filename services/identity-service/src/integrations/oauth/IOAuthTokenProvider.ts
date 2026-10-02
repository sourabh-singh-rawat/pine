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
  introspectToken(token: string, scope?: string): Promise<IntrospectTokenResult>;
}
