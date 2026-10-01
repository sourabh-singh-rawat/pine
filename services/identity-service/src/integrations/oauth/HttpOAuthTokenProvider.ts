import { InvalidCredentialError } from "@/integrations/identity";
import type {
  IntrospectTokenResult,
  IOAuthTokenProvider,
} from "@/integrations/oauth/IOAuthTokenProvider";

export type HttpOAuthTokenProviderOptions = {
  baseUrl: string;
};

export class HttpOAuthTokenProvider implements IOAuthTokenProvider {
  private readonly baseUrl: string;

  constructor(options: HttpOAuthTokenProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  async introspectToken(token: string, scope?: string): Promise<IntrospectTokenResult> {
    const body: { token: string; scope?: string } = { token };
    if (scope) {
      body.scope = scope;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/oauth/introspect`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      throw new InvalidCredentialError(`OAuth introspect request failed: ${message}`);
    }

    if (!response.ok) {
      throw new InvalidCredentialError(`OAuth introspect failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!isIntrospectResponse(payload)) {
      throw new InvalidCredentialError("OAuth introspect returned an invalid response body");
    }

    return {
      active: payload.active,
      ...(typeof payload.subject === "string" ? { subject: payload.subject } : {}),
      ...(typeof payload.clientId === "string" ? { clientId: payload.clientId } : {}),
      ...(typeof payload.scope === "string" ? { scope: payload.scope } : {}),
      ...(typeof payload.expiresAt === "string" ? { expiresAt: new Date(payload.expiresAt) } : {}),
      ...(typeof payload.issuedAt === "string" ? { issuedAt: new Date(payload.issuedAt) } : {}),
      ...(Array.isArray(payload.audience) && payload.audience.every((v) => typeof v === "string")
        ? { audience: payload.audience }
        : {}),
      ...(isRecord(payload.extra) ? { extra: payload.extra } : {}),
    };
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isIntrospectResponse = (
  value: unknown,
): value is {
  active: boolean;
  subject?: string;
  clientId?: string;
  scope?: string;
  expiresAt?: string;
  issuedAt?: string;
  audience?: string[];
  extra?: Record<string, unknown>;
} => isRecord(value) && typeof value.active === "boolean";
