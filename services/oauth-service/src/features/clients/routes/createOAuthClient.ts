import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { InvalidCreateClientBodyError } from "@/features/clients/errors";
import {
  CreateOAuthClientBodySchema,
  OAuthClientResponseSchema,
  type OAuthClientResponse,
} from "@/features/clients/schemas";
import type { IClientService } from "@/features/clients/services";

export const createOAuthClient: HttpRoute = {
  url: "/oauth/clients",
  method: "POST",
  schema: {
    tags: ["clients"],
    summary: "Create OAuth client",
    description: "Register a new OAuth 2.0 client with the authorization server",
    operationId: "createOAuthClient",
    body: CreateOAuthClientBodySchema,
    response: {
      200: OAuthClientResponseSchema,
    },
  },
  handler: async (request) => {
    if (!Value.Check(CreateOAuthClientBodySchema, request.body)) {
      throw new InvalidCreateClientBodyError();
    }

    const service = container.get<IClientService>(TYPES.ClientService);
    const client = await service.createClient({
      name: request.body.name,
      redirectUris: request.body.redirectUris,
      scopes: request.body.scopes,
      grantTypes: request.body.grantTypes,
    });

    const response: OAuthClientResponse = client;
    return json(response);
  },
};
