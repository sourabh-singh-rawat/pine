import { readApiData } from "@pine/common";
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
    let data: unknown;
    try {
      data = readApiData(payload);
    } catch {
      throw new InvalidCredentialError("OAuth introspect returned an invalid response body");
    }
    if (!isIntrospectResponse(data)) {
      throw new InvalidCredentialError("OAuth introspect returned an invalid response body");
    }

    return {
      active: data.active,
      ...(typeof data.subject === "string" ? { subject: data.subject } : {}),
      ...(typeof data.clientId === "string" ? { clientId: data.clientId } : {}),
      ...(typeof data.scope === "string" ? { scope: data.scope } : {}),
      ...(typeof data.expiresAt === "string" ? { expiresAt: new Date(data.expiresAt) } : {}),
      ...(typeof data.issuedAt === "string" ? { issuedAt: new Date(data.issuedAt) } : {}),
      ...(Array.isArray(data.audience) && data.audience.every((v) => typeof v === "string")
        ? { audience: data.audience }
        : {}),
      ...(isRecord(data.extra) ? { extra: data.extra } : {}),
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
