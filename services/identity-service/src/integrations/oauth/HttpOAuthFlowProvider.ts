import { InvalidCredentialError } from "@/integrations/identity";
import type {
  AcceptLoginInput,
  IOAuthFlowProvider,
  OAuthRedirectResult,
} from "@/integrations/oauth/IOAuthFlowProvider";

export type HttpOAuthFlowProviderOptions = {
  baseUrl: string;
};

export class HttpOAuthFlowProvider implements IOAuthFlowProvider {
  private readonly baseUrl: string;

  constructor(options: HttpOAuthFlowProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  async acceptLoginRequest(input: AcceptLoginInput): Promise<OAuthRedirectResult> {
    const body: {
      challenge: string;
      subject: string;
      remember?: boolean;
      rememberFor?: number;
      identityProviderSessionId?: string;
    } = {
      challenge: input.challenge,
      subject: input.subject,
    };
    if (input.remember !== undefined) {
      body.remember = input.remember;
    }
    if (input.rememberFor !== undefined) {
      body.rememberFor = input.rememberFor;
    }
    if (input.identityProviderSessionId !== undefined) {
      body.identityProviderSessionId = input.identityProviderSessionId;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/internal/oauth/login/accept`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      throw new InvalidCredentialError(`OAuth accept login request failed: ${message}`);
    }

    if (!response.ok) {
      throw new InvalidCredentialError(`OAuth accept login failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!isRedirectResponse(payload)) {
      throw new InvalidCredentialError("OAuth accept login returned an invalid response body");
    }

    return { redirectTo: payload.redirectTo };
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isRedirectResponse = (value: unknown): value is { redirectTo: string } =>
  isRecord(value) && typeof value.redirectTo === "string" && value.redirectTo.length > 0;
