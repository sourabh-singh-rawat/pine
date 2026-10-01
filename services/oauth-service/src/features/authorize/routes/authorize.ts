import type { HttpResponse, HttpRoute } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { AuthorizeQuerySchema, InitialAuthorizeQuerySchema } from "@/features/authorize/schemas";
import type { IAuthorizeService } from "@/features/authorize/services";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

export const authorize: HttpRoute = {
  url: "/oauth/authorize",
  method: "GET",
  schema: {
    tags: ["authorize"],
    summary: "OAuth authorize",
    description:
      "Start or continue the OAuth authorization code flow. Proxies the authorization server public authorize endpoint and returns its redirect.",
    operationId: "authorize",
    querystring: AuthorizeQuerySchema,
    response: {
      302: {
        description: "Redirect to login, consent, or the client redirect URI",
        type: "null",
      },
    },
  },
  handler: async (request): Promise<HttpResponse> => {
    if (!Value.Check(AuthorizeQuerySchema, request.query)) {
      throw new InvalidOAuthRequestError("Invalid OAuth authorize query parameters");
    }

    const loginVerifier = request.query.login_verifier;
    const consentVerifier = request.query.consent_verifier;
    const hasVerifier =
      (typeof loginVerifier === "string" && loginVerifier.length > 0) ||
      (typeof consentVerifier === "string" && consentVerifier.length > 0);

    if (!hasVerifier && !Value.Check(InitialAuthorizeQuerySchema, request.query)) {
      throw new InvalidOAuthRequestError("Invalid OAuth authorize query parameters");
    }

    const searchIndex = request.url.indexOf("?");
    const service = container.get<IAuthorizeService>(TYPES.AuthorizeService);
    const result = await service.authorize({
      search: searchIndex >= 0 ? request.url.slice(searchIndex) : "",
      cookieHeader: request.headers.cookie,
    });

    return {
      status: result.status,
      ...(result.location ? { headers: { Location: result.location } } : {}),
      ...(result.body !== undefined ? { body: result.body } : {}),
      ...(result.cookies.length > 0 ? { cookies: result.cookies } : {}),
    };
  },
};
