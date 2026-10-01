import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import {
  IntrospectTokenBodySchema,
  IntrospectTokenResponseSchema,
  type IntrospectTokenResponse,
} from "@/features/token/schemas";
import type { ITokenService } from "@/features/token/services";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

export const introspect: HttpRoute = {
  url: "/oauth/introspect",
  method: "POST",
  schema: {
    tags: ["token"],
    summary: "Introspect OAuth token",
    description: "Introspect an access or refresh token via the OAuth provider",
    operationId: "introspectToken",
    body: IntrospectTokenBodySchema,
    response: {
      200: IntrospectTokenResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(IntrospectTokenBodySchema, request.body)) {
      throw new InvalidOAuthRequestError("Invalid introspect body");
    }

    const service = container.get<ITokenService>(TYPES.TokenService);
    const result = await service.introspect({
      token: request.body.token,
      scope: request.body.scope,
    });

    const response: IntrospectTokenResponse = {
      active: result.active,
      ...(result.subject ? { subject: result.subject } : {}),
      ...(result.clientId ? { clientId: result.clientId } : {}),
      ...(result.scope ? { scope: result.scope } : {}),
      ...(result.expiresAt ? { expiresAt: result.expiresAt.toISOString() } : {}),
      ...(result.issuedAt ? { issuedAt: result.issuedAt.toISOString() } : {}),
      ...(result.audience ? { audience: result.audience } : {}),
      ...(result.extra ? { extra: result.extra } : {}),
    };

    return json(response);
  },
};
