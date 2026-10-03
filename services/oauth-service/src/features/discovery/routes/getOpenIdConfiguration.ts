import type { HttpResponse, HttpRoute } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { OpenIdConfigurationSchema } from "@/features/discovery/schemas";
import type { IDiscoveryService } from "@/features/discovery/services";

export const getOpenIdConfiguration: HttpRoute = {
  url: "/oauth/.well-known/openid-configuration",
  method: "GET",
  schema: {
    tags: ["discovery"],
    summary: "OpenID Provider configuration",
    description:
      "OIDC discovery document for the public authorization server. Endpoint URLs use OAUTH_PUBLIC_URL.",
    operationId: "getOpenIdConfiguration",
    response: {
      200: OpenIdConfigurationSchema,
    },
  },
  handler: async (): Promise<HttpResponse> => {
    const service = container.get<IDiscoveryService>(TYPES.DiscoveryService);
    const configuration = await service.getOpenIdConfiguration();

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: configuration,
    };
  },
};
