import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import {
  AcceptConsentBodySchema,
  ConsentActionResponseSchema,
  ConsentQuerySchema,
} from "@/features/oauth/schemas";
import type { IOAuthService } from "@/features/oauth/services";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

export const acceptConsent: HttpRoute = {
  url: "/identity/oauth/consent/accept",
  method: "POST",
  schema: {
    tags: ["oauth"],
    summary: "Accept OAuth consent",
    description: "Accept an OAuth consent challenge with granted scopes",
    operationId: "acceptConsentChallenge",
    querystring: ConsentQuerySchema,
    body: AcceptConsentBodySchema,
    response: {
      200: ConsentActionResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(ConsentQuerySchema, request.query)) {
      throw new InvalidOAuthRequestError("Invalid OAuth consent query parameters");
    }
    if (!Value.Check(AcceptConsentBodySchema, request.body)) {
      throw new InvalidOAuthRequestError("Invalid accept consent body");
    }

    const service = container.get<IOAuthService>(TYPES.OAuthService);
    const result = await service.acceptConsent({
      challenge: request.query.consent_challenge,
      grantScope: request.body.grantScope,
      remember: request.body.remember,
      rememberFor: request.body.rememberFor,
    });

    return json(result);
  },
};
