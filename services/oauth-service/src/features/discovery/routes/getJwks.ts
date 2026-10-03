import type { HttpResponse, HttpRoute } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { JwksSchema } from "@/features/discovery/schemas";
import type { IDiscoveryService } from "@/features/discovery/services";

export const getJwks: HttpRoute = {
  url: "/oauth/.well-known/jwks.json",
  method: "GET",
  schema: {
    tags: ["discovery"],
    summary: "JSON Web Key Set",
    description: "Public keys used to verify ID tokens issued by the authorization server.",
    operationId: "getJwks",
    response: {
      200: JwksSchema,
    },
  },
  handler: async (): Promise<HttpResponse> => {
    const service = container.get<IDiscoveryService>(TYPES.DiscoveryService);
    const jwks = await service.getJwks();

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: jwks,
    };
  },
};
