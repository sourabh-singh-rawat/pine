import type { HttpResponseCookie, HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { TokenBodySchema, TokenResponseSchema, type TokenResponse } from "@/features/oauth/schemas";
import type { IOAuthService } from "@/features/oauth/services";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

export const token: HttpRoute = {
  url: "/identity/oauth/token",
  method: "POST",
  schema: {
    tags: ["oauth"],
    summary: "OAuth token",
    description:
      "Exchange an authorization code for access (and optional refresh/id) tokens and set them as HTTP-only cookies",
    operationId: "exchangeToken",
    body: TokenBodySchema,
    response: {
      200: TokenResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(TokenBodySchema, request.body)) {
      throw new InvalidOAuthRequestError("Invalid token body");
    }

    const service = container.get<IOAuthService>(TYPES.OAuthService);
    const result = await service.exchangeToken({
      grantType: request.body.grant_type,
      code: request.body.code,
      clientId: request.body.client_id,
      redirectUri: request.body.redirect_uri,
      codeVerifier: request.body.code_verifier,
    });

    const tokenCookieOptions: Omit<HttpResponseCookie, "name" | "value"> = {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    };

    const accessExpires =
      typeof result.expiresIn === "number"
        ? new Date(Date.now() + result.expiresIn * 1000)
        : undefined;

    const cookies = [
      {
        name: "accessToken",
        value: result.accessToken,
        ...tokenCookieOptions,
        ...(accessExpires ? { expires: accessExpires } : {}),
      },
      ...(result.refreshToken
        ? [
            {
              name: "refreshToken",
              value: result.refreshToken,
              ...tokenCookieOptions,
            },
          ]
        : []),
      ...(result.idToken
        ? [
            {
              name: "idToken",
              value: result.idToken,
              ...tokenCookieOptions,
              ...(accessExpires ? { expires: accessExpires } : {}),
            },
          ]
        : []),
    ];

    const response: TokenResponse = {
      message: "Tokens issued successfully.",
    };

    return {
      ...json(response),
      cookies,
    };
  },
};
