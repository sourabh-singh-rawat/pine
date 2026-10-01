import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { ConsentQuerySchema, ConsentResponseSchema } from "@/features/consent/schemas";
import type { IConsentService } from "@/features/consent/services";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

export const consent: HttpRoute = {
  url: "/oauth/consent",
  method: "GET",
  schema: {
    tags: ["consent"],
    summary: "OAuth consent challenge",
    description: "Load OAuth consent challenge details by consent_challenge",
    operationId: "getConsentChallenge",
    querystring: ConsentQuerySchema,
    response: {
      200: ConsentResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(ConsentQuerySchema, request.query)) {
      throw new InvalidOAuthRequestError("Invalid OAuth consent query parameters");
    }

    const service = container.get<IConsentService>(TYPES.ConsentService);
    const result = await service.getChallenge(request.query.consent_challenge);

    return json(result);
  },
};
