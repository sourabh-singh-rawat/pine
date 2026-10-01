import type { HttpRoute } from "@pine/server";
import { redirect } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { AuthorizeQuerySchema } from "@/features/authorize/schemas";
import type { IAuthorizeService } from "@/features/authorize/services";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

export const authorize: HttpRoute = {
  url: "/oauth/authorize",
  method: "GET",
  schema: {
    tags: ["authorize"],
    summary: "OAuth authorize",
    description:
      "Start the OAuth authorization code flow. Redirects (302) to the OAuth provider authorization endpoint.",
    operationId: "authorize",
    querystring: AuthorizeQuerySchema,
    response: {
      302: {
        description: "Redirect to the OAuth provider authorization endpoint",
        type: "null",
      },
    },
  },
  handler: async (request) => {
    if (!Value.Check(AuthorizeQuerySchema, request.query)) {
      throw new InvalidOAuthRequestError("Invalid OAuth authorize query parameters");
    }

    const service = container.get<IAuthorizeService>(TYPES.AuthorizeService);

    const result = await service.authorize({
      clientId: request.query.client_id,
      redirectUri: request.query.redirect_uri,
      responseType: request.query.response_type,
      scope: request.query.scope,
      state: request.query.state,
      codeChallenge: request.query.code_challenge,
      codeChallengeMethod: request.query.code_challenge_method,
      nonce: request.query.nonce,
    });

    return redirect(result.redirectTo);
  },
};
