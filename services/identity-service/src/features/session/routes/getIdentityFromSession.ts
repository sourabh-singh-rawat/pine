import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import type { ISessionService } from "@/features/session/services";
import {
  GetIdentityFromSessionResponseSchema,
  type GetIdentityFromSessionData,
} from "@/features/session/schemas";
import { InvalidCredentialError } from "@/integrations/identity";

export const getIdentityFromSession: HttpRoute = {
  url: "/identity/getIdentityFromSession",
  method: "GET",
  schema: {
    tags: ["auth"],
    summary: "Resolve session identity",
    description:
      "Verify the session cookie against Ory Kratos (SDK FrontendApi.toSession) and return the authenticated identity. Used by other services via @pine/identity.",
    operationId: "getIdentityFromSession",
    response: {
      200: GetIdentityFromSessionResponseSchema,
    },
  },
  handler: async (request) => {
    const sessionToken = request.cookies.session;

    if (!sessionToken) {
      throw new InvalidCredentialError("No active session");
    }

    const service = container.get<ISessionService>(TYPES.SessionService);
    const identity = await service.getIdentityFromSessionToken(sessionToken);

    const response: GetIdentityFromSessionData = {
      identity: {
        id: identity.id,
        email: identity.email,
        emailVerified: identity.emailVerified ?? false,
      },
    };

    return json(response);
  },
};
