export interface AcceptLoginInput {
  challenge: string;
  subject: string;
  remember?: boolean;
  rememberFor?: number;
  identityProviderSessionId?: string;
}

export interface OAuthRedirectResult {
  redirectTo: string;
}

export interface IOAuthFlowProvider {
  acceptLoginRequest(input: AcceptLoginInput): Promise<OAuthRedirectResult>;
}
