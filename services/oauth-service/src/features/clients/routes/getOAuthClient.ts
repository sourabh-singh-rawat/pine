import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { ClientNotFoundError } from "@/features/clients/errors";
import {
  OAuthClientParamsSchema,
  OAuthClientResponseSchema,
  type OAuthClientResponse,
} from "@/features/clients/schemas";
import type { IClientService } from "@/features/clients/services";

export const getOAuthClient: HttpRoute = {
  url: "/oauth/clients/:clientId",
  method: "GET",
  schema: {
    tags: ["clients"],
    summary: "Get OAuth client",
    description: "Fetch an OAuth 2.0 client by client id",
    operationId: "getOAuthClient",
    params: OAuthClientParamsSchema,
    response: {
      200: OAuthClientResponseSchema,
    },
  },
  handler: async (request) => {
    const clientId = request.params.clientId;
    if (clientId === undefined) {
      throw new ClientNotFoundError("unknown");
    }

    const service = container.get<IClientService>(TYPES.ClientService);
    const client = await service.getClientById(clientId);
    if (!client) {
      throw new ClientNotFoundError(clientId);
    }

    const response: OAuthClientResponse = client;
    return json(response);
  },
};
