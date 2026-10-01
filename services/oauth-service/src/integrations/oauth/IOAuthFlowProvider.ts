export interface AuthorizeInput {
  clientId: string;
  redirectUri: string;
  responseType: "code";
  scope: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  nonce?: string;
}

export interface OAuthClientInfo {
  id: string;
  name?: string;
  redirectUris?: string[];
}

export interface LoginChallenge {
  challenge: string;
  skip: boolean;
  subject?: string;
  client: OAuthClientInfo;
  requestedScope: string[];
  requestUrl?: string;
  sessionId?: string;
}

export interface AcceptLoginInput {
  challenge: string;
  subject: string;
  remember?: boolean;
  rememberFor?: number;
  identityProviderSessionId?: string;
  context?: Record<string, unknown>;
}

export interface ConsentChallenge {
  challenge: string;
  skip: boolean;
  subject?: string;
  client: OAuthClientInfo;
  requestedScope: string[];
  requestUrl?: string;
  loginChallenge?: string;
  loginSessionId?: string;
}

export interface AcceptConsentInput {
  challenge: string;
  grantScope: string[];
  remember?: boolean;
  rememberFor?: number;
  accessTokenExtra?: Record<string, unknown>;
  idTokenExtra?: Record<string, unknown>;
}

export interface RejectRequestInput {
  challenge: string;
  error?: string;
  errorDescription?: string;
}

export interface OAuthRedirectResult {
  redirectTo: string;
}

export interface IOAuthFlowProvider {
  getAuthorizationUrl(input: AuthorizeInput): string;

  getLoginRequest(challenge: string): Promise<LoginChallenge>;
  acceptLoginRequest(input: AcceptLoginInput): Promise<OAuthRedirectResult>;
  rejectLoginRequest(input: RejectRequestInput): Promise<OAuthRedirectResult>;

  getConsentRequest(challenge: string): Promise<ConsentChallenge>;
  acceptConsentRequest(input: AcceptConsentInput): Promise<OAuthRedirectResult>;
  rejectConsentRequest(input: RejectRequestInput): Promise<OAuthRedirectResult>;
}
