import { readApiData } from "@pine/common";
import type { HttpRequest } from "@pine/server";
import Value from "typebox/value";
import type { IIdentityClient } from "./IIdentityClient";
import {
  GetIdentityFromAccessTokenResponseSchema,
  GetIdentityFromSessionResponseSchema,
  type Identity,
} from "./schemas";

const BEARER_PREFIX = /^Bearer\s+/i;

export interface HttpIdentityClientOptions {
  baseUrl: string;
}

export class HttpIdentityClient implements IIdentityClient {
  private readonly baseUrl: string;

  constructor(options: HttpIdentityClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  async resolveRequestIdentity(request: HttpRequest): Promise<void> {
    const authorization = request.headers.authorization;
    const headerToken = authorization ? authorization.replace(BEARER_PREFIX, "").trim() : "";
    const cookieToken = request.cookies.accessToken;
    const accessToken =
      headerToken.length > 0
        ? headerToken
        : typeof cookieToken === "string" && cookieToken.length > 0
          ? cookieToken
          : null;

    if (accessToken) {
      const identity = await this.getIdentityViaAccessToken(accessToken);
      if (identity) {
        request.identity = { id: identity.id, authMethod: "access_token" };
        return;
      }
    }

    const cookieHeader = request.headers.cookie;
    if (cookieHeader && (request.cookies.session || /(?:^|;\s*)session=/.test(cookieHeader))) {
      const identity = await this.getIdentityViaSession(cookieHeader);
      if (identity) {
        request.identity = { id: identity.id, authMethod: "session" };
      }
    }
  }

  async getIdentityViaSession(cookieHeader: string): Promise<Identity | null> {
    try {
      const response = await fetch(`${this.baseUrl}/identity/getIdentityFromSession`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: cookieHeader,
        },
      });

      if (!response.ok) {
        return null;
      }

      const body: unknown = await response.json();
      const data = readApiData(body);
      if (!Value.Check(GetIdentityFromSessionResponseSchema, data)) {
        return null;
      }

      return data.identity;
    } catch {
      return null;
    }
  }

  async getIdentityViaAccessToken(accessToken: string): Promise<Identity | null> {
    try {
      const response = await fetch(`${this.baseUrl}/identity/getIdentityFromAccessToken`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const body: unknown = await response.json();
      const data = readApiData(body);
      if (!Value.Check(GetIdentityFromAccessTokenResponseSchema, data)) {
        return null;
      }

      return data.identity;
    } catch {
      return null;
    }
  }
}
