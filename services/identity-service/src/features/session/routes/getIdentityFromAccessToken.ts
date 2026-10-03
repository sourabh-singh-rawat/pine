import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import type { ISessionService } from "@/features/session/services";
import {
  GetIdentityFromAccessTokenResponseSchema,
  type GetIdentityFromAccessTokenData,
} from "@/features/session/schemas";
import { InvalidCredentialError } from "@/integrations/identity";

const BEARER_PREFIX = /^Bearer\s+/i;

const extractBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader) {
    return null;
  }
  const token = authorizationHeader.replace(BEARER_PREFIX, "").trim();
  return token.length > 0 ? token : null;
};

export const getIdentityFromAccessToken: HttpRoute = {
  url: "/identity/getIdentityFromAccessToken",
  method: "GET",
  schema: {
    tags: ["auth"],
    summary: "Resolve identity from OAuth access token",
    description:
      "Introspect an OAuth provider access token (Authorization: Bearer) and return the authenticated identity. Used by other services via @pine/identity.",
    operationId: "getIdentityFromAccessToken",
    security: [{ bearerAuth: [] }],
    response: {
      200: GetIdentityFromAccessTokenResponseSchema,
    },
  },
  handler: async (request) => {
    const accessToken = extractBearerToken(request.headers.authorization);

    if (!accessToken) {
      throw new InvalidCredentialError("No access token");
    }

    const service = container.get<ISessionService>(TYPES.SessionService);
    const identity = await service.getIdentityFromAccessToken(accessToken);

    const response: GetIdentityFromAccessTokenData = {
      identity: {
        id: identity.id,
        email: identity.email,
        emailVerified: identity.emailVerified ?? false,
      },
    };

    return json(response);
  },
};
