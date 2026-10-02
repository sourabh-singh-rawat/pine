export interface AcceptOptions {
  challenge: string;
  subject: string;
  remember?: boolean;
  rememberFor?: number;
  identityProviderSessionId?: string;
}

export interface AcceptResult {
  redirectTo: string;
}

export interface ILoginService {
  accept(params: AcceptOptions): Promise<AcceptResult>;
}
