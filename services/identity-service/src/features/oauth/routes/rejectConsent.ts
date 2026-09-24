import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import {
  ConsentActionResponseSchema,
  ConsentQuerySchema,
  RejectConsentBodySchema,
} from "@/features/oauth/schemas";
import type { IOAuthService } from "@/features/oauth/services";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

export const rejectConsent: HttpRoute = {
  url: "/identity/oauth/consent/reject",
  method: "POST",
  schema: {
    tags: ["oauth"],
    summary: "Reject OAuth consent",
    description: "Reject an OAuth consent challenge when the user denies access",
    operationId: "rejectConsentChallenge",
    querystring: ConsentQuerySchema,
    body: RejectConsentBodySchema,
    response: {
      200: ConsentActionResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(ConsentQuerySchema, request.query)) {
      throw new InvalidOAuthRequestError("Invalid OAuth consent query parameters");
    }
    if (!Value.Check(RejectConsentBodySchema, request.body)) {
      throw new InvalidOAuthRequestError("Invalid reject consent body");
    }

    const service = container.get<IOAuthService>(TYPES.OAuthService);
    const result = await service.rejectConsent({
      challenge: request.query.consent_challenge,
      error: request.body.error,
      errorDescription: request.body.errorDescription,
    });

    return json(result);
  },
};
