import { resolveIdentityFromHeaders, resolveTenantContextFromHeaders } from "@pine/identity";
import { createHttpServer, type IHttpServer } from "@pine/server";
import { Container } from "inversify";
import { readFileSync } from "node:fs";
import path from "node:path";
import { TYPES } from "@/bootstrap/container-types";
import { env } from "@/bootstrap/env";
import { hydraClient } from "@/bootstrap/hydra-client";
import { logger } from "@/bootstrap/logger";
import { AuthorizeService, type IAuthorizeService } from "@/features/authorize";
import { ClientSeederService, ClientService, type IClientSeederService, type IClientService } from "@/features/clients";
import { ConsentService, type IConsentService } from "@/features/consent";
import { DiscoveryService, type IDiscoveryService } from "@/features/discovery";
import { LoginService, type ILoginService } from "@/features/login";
import { TokenService, type ITokenService } from "@/features/token";
import {
  HydraOAuthClientProvider,
  HydraOAuthDiscoveryProvider,
  HydraOAuthFlowProvider,
  HydraOAuthTokenProvider,
  type IOAuthClientProvider,
  type IOAuthDiscoveryProvider,
  type IOAuthFlowProvider,
  type IOAuthTokenProvider,
} from "@/integrations/oauth";
import { routes } from "@/routes";

export const container = new Container({ defaultScope: "Singleton" });

container.bind(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.HydraClient).toConstantValue(hydraClient);
container.bind<IOAuthFlowProvider>(TYPES.OAuthFlowProvider).to(HydraOAuthFlowProvider);
container.bind<IOAuthTokenProvider>(TYPES.OAuthTokenProvider).to(HydraOAuthTokenProvider);
container.bind<IOAuthClientProvider>(TYPES.OAuthClientProvider).to(HydraOAuthClientProvider);
container.bind<IOAuthDiscoveryProvider>(TYPES.OAuthDiscoveryProvider).to(HydraOAuthDiscoveryProvider);
container.bind<IAuthorizeService>(TYPES.AuthorizeService).to(AuthorizeService);
container.bind<IConsentService>(TYPES.ConsentService).to(ConsentService);
container.bind<ILoginService>(TYPES.LoginService).to(LoginService);
container.bind<ITokenService>(TYPES.TokenService).to(TokenService);
container.bind<IClientService>(TYPES.ClientService).to(ClientService);
container.bind<IClientSeederService>(TYPES.ClientSeederService).to(ClientSeederService);
container.bind<IDiscoveryService>(TYPES.DiscoveryService).to(DiscoveryService);

container.bind<IHttpServer>(TYPES.HttpServer).toConstantValue(
  createHttpServer({
    config: {
      host: "0.0.0.0",
      port: 5008,
      environment: env.NODE_ENV,
      version: 1,
    },
    https: {
      key: readFileSync(env.OAUTH_SERVICE_TLS_KEY_PATH),
      cert: readFileSync(env.OAUTH_SERVICE_TLS_CERT_PATH),
      ca: readFileSync(env.CA_CERT_PATH),
      requestCert: true,
      rejectUnauthorized: true,
    },
    cookie: {},
    openapi: {
      info: {
        title: "OAuth Service",
        version: "0.0.0",
        description: "OAuth 2.0 / OIDC authorization server APIs (Ory Hydra)",
        license: { name: "ISC", url: "https://opensource.org/license/isc-license-txt" },
      },
      servers: [{ url: env.OAUTH_SERVICE_URL }],
      tags: [
        { name: "authorize", description: "OAuth authorize end-points" },
        { name: "login", description: "OAuth login challenge end-points" },
        { name: "consent", description: "OAuth consent challenge end-points" },
        { name: "token", description: "OAuth token end-points" },
        { name: "clients", description: "OAuth client admin end-points" },
        { name: "discovery", description: "OIDC discovery and JWKS end-points" },
      ],
    },
    hooks: {
      onRequest: [resolveIdentityFromHeaders, resolveTenantContextFromHeaders],
    },
    routes,
  }),
);

export const openApiOutputPath = path.join(process.cwd(), "dist", "openapi.json");
