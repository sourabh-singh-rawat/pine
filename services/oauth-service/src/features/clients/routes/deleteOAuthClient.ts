import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { ClientNotFoundError } from "@/features/clients/errors";
import {
  DeleteOAuthClientResponseSchema,
  OAuthClientParamsSchema,
  type DeleteOAuthClientResponse,
} from "@/features/clients/schemas";
import type { IClientService } from "@/features/clients/services";

export const deleteOAuthClient: HttpRoute = {
  url: "/oauth/clients/:clientId",
  method: "DELETE",
  schema: {
    tags: ["clients"],
    summary: "Delete OAuth client",
    description: "Delete an OAuth 2.0 client by client id",
    operationId: "deleteOAuthClient",
    params: OAuthClientParamsSchema,
    response: {
      200: DeleteOAuthClientResponseSchema,
    },
  },
  handler: async (request) => {
    const clientId = request.params.clientId;
    if (clientId === undefined) {
      throw new ClientNotFoundError("unknown");
    }

    const service = container.get<IClientService>(TYPES.ClientService);
    await service.deleteClientById(clientId);

    const response: DeleteOAuthClientResponse = { deleted: true };
    return json(response);
  },
};
