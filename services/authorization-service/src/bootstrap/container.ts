import { HttpAuthorizationClient, type IAuthorizationClient } from "@pine/authorization";
import type { IBroker } from "@pine/events";
import {
  resolveIdentityFromHeaders,
  resolveTenantContextFromHeaders,
} from "@pine/identity";
import { createHttpServer, type IHttpServer } from "@pine/server";
import { Container } from "inversify";
import { readFileSync } from "node:fs";
import path from "node:path";
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { env } from "@/bootstrap/env";
import { ketoClient } from "@/bootstrap/keto-client";
import { logger } from "@/bootstrap/logger";
import { AuthorizationService, type IAuthorizationService } from "@/features/authorization";
import { AuthorizationProfileSyncConsumer } from "@/features/identity";
import {
  AuthorizationItemSyncConsumer,
  AuthorizationProjectSyncConsumer,
  AuthorizationSpaceSyncConsumer,
} from "@/features/issues";

import {
  AuthorizationWorkspaceRelationSyncConsumer,
  AuthorizationWorkspaceSyncConsumer,
  AuthorizationPlatformRelationSyncConsumer,
  AuthorizationTenantRelationSyncConsumer,
  AuthorizationTenantSyncConsumer,
} from "@/features/platform";

import type { IAuthorizationGraphProvider } from "@/integrations/authorization";
import { KetoAuthorizationGraphProvider, KetoClient } from "@/integrations/authorization/ory-keto";
import { routes } from "@/routes";

export const container = new Container({ defaultScope: "Singleton" });

container.bind(TYPES.Logger).toConstantValue(logger);
container.bind<IBroker>(TYPES.Broker).toConstantValue(broker);
container.bind<KetoClient>(TYPES.KetoClient).toConstantValue(ketoClient);
container.bind<IAuthorizationGraphProvider>(TYPES.AuthorizationGraphProvider).to(KetoAuthorizationGraphProvider);
container.bind<IAuthorizationService>(TYPES.AuthorizationService).to(AuthorizationService);
container.bind<IAuthorizationClient>(TYPES.AuthorizationClient).toConstantValue(new HttpAuthorizationClient({ baseUrl: env.AUTHORIZATION_SERVICE_URL }));
container.bind<AuthorizationTenantSyncConsumer>(TYPES.AuthorizationTenantSyncConsumer).to(AuthorizationTenantSyncConsumer);
container.bind<AuthorizationWorkspaceSyncConsumer>(TYPES.AuthorizationWorkspaceSyncConsumer).to(AuthorizationWorkspaceSyncConsumer);
container
  .bind<AuthorizationWorkspaceRelationSyncConsumer>(TYPES.AuthorizationWorkspaceRelationSyncConsumer)
  .to(AuthorizationWorkspaceRelationSyncConsumer);
container.bind<AuthorizationTenantRelationSyncConsumer>(TYPES.AuthorizationTenantRelationSyncConsumer).to(AuthorizationTenantRelationSyncConsumer);
container.bind<AuthorizationPlatformRelationSyncConsumer>(TYPES.AuthorizationPlatformRelationSyncConsumer).to(AuthorizationPlatformRelationSyncConsumer);
container.bind<AuthorizationProfileSyncConsumer>(TYPES.AuthorizationProfileSyncConsumer).to(AuthorizationProfileSyncConsumer);
container.bind<AuthorizationSpaceSyncConsumer>(TYPES.AuthorizationSpaceSyncConsumer).to(AuthorizationSpaceSyncConsumer);
container.bind<AuthorizationProjectSyncConsumer>(TYPES.AuthorizationProjectSyncConsumer).to(AuthorizationProjectSyncConsumer);
container.bind<AuthorizationItemSyncConsumer>(TYPES.AuthorizationItemSyncConsumer).to(AuthorizationItemSyncConsumer);

container.bind<IHttpServer>(TYPES.HttpServer).toConstantValue(
  createHttpServer({
    config: {
      host: "0.0.0.0",
      port: 5006,
      environment: env.NODE_ENV,
      version: 1,
    },
    https: {
      key: readFileSync(env.AUTHORIZATION_SERVICE_TLS_KEY_PATH),
      cert: readFileSync(env.AUTHORIZATION_SERVICE_TLS_CERT_PATH),
      ca: readFileSync(env.CA_CERT_PATH),
      requestCert: true,
      rejectUnauthorized: true,
    },
    cookie: { secret: env.JWT_SECRET },
    openapi: {
      info: {
        title: "Authorization Service",
        version: "0.0.0",
        description: "Authorization graph APIs (Ory Keto)",
        license: { name: "ISC", url: "https://opensource.org/license/isc-license-txt" },
      },
      servers: [{ url: env.AUTHORIZATION_SERVICE_URL }],
      tags: [{ name: "authorization", description: "Authorization graph end-points" }],
    },
    hooks: {
      onRequest: [resolveIdentityFromHeaders, resolveTenantContextFromHeaders],
    },
    routes,
  }),
);

export const openApiOutputPath = path.join(process.cwd(), "dist", "openapi.json");
