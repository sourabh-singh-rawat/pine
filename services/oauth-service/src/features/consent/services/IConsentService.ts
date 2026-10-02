import type { ConsentScopeDetail } from "@/features/consent/schemas";
import type { ConsentChallenge } from "@/integrations/oauth";

export type ConsentChallengeResult = ConsentChallenge & {
  scopes: ConsentScopeDetail[];
};

export interface AcceptOptions {
  challenge: string;
  grantScope: string[];
  remember?: boolean;
  rememberFor?: number;
}

export interface RejectOptions {
  challenge: string;
  error?: string;
  errorDescription?: string;
}

export interface ConsentActionResult {
  redirectTo: string;
}

export interface IConsentService {
  getChallenge: (challenge: string) => Promise<ConsentChallengeResult>;
  accept: (params: AcceptOptions) => Promise<ConsentActionResult>;
  reject: (params: RejectOptions) => Promise<ConsentActionResult>;
}
