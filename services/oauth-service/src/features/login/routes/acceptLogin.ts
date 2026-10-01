import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import {
  AcceptLoginBodySchema,
  AcceptLoginResponseSchema,
  type AcceptLoginResponse,
} from "@/features/login/schemas";
import type { ILoginService } from "@/features/login/services";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

export const acceptLogin: HttpRoute = {
  url: "/oauth/login/accept",
  method: "POST",
  schema: {
    tags: ["login"],
    summary: "Accept OAuth login challenge",
    description: "Accept a Hydra login challenge after the user authenticates",
    operationId: "acceptLoginChallenge",
    body: AcceptLoginBodySchema,
    response: {
      200: AcceptLoginResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(AcceptLoginBodySchema, request.body)) {
      throw new InvalidOAuthRequestError("Invalid accept login body");
    }

    const service = container.get<ILoginService>(TYPES.LoginService);
    const result = await service.accept({
      challenge: request.body.challenge,
      subject: request.body.subject,
      remember: request.body.remember,
      rememberFor: request.body.rememberFor,
      identityProviderSessionId: request.body.identityProviderSessionId,
    });

    const response: AcceptLoginResponse = { redirectTo: result.redirectTo };
    return json(response);
  },
};
