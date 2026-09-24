import { HttpAuthorizationClient, type IAuthorizationClient } from "@pine/authorization";
import {
  resolveIdentityFromHeaders,
  resolveTenantContextFromHeaders,
} from "@pine/identity";
import { createGraphQLServer, createHttpServer, type IHttpServer } from "@pine/server";
import { Container } from "inversify";
import { readFileSync } from "node:fs";
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { db } from "@/bootstrap/db";
import { env } from "@/bootstrap/env";
import { logger } from "@/bootstrap/logger";
import { createContext } from "@/graphql";
import {
  type IAuditLogRepository,
  type IAuditLogService,
  AuditLogRepository,
  AuditLogService,
} from "@/features/audit";
import {
  type IIdentityRepository,
  IdentityRepository,
  AuditIdentitySyncConsumer,
} from "@/features/identities";
import { type IItemRepository, ItemRepository, AuditItemsSyncConsumer } from "@/features/items";
import { type ISpaceRepository, SpaceRepository } from "@/features/spaces";
import {
  type IWorkspaceRepository,
  WorkspaceRepository,
  AuditPlatformSyncConsumer,
} from "@/features/workspaces";
import {
  type IAttachmentRepository,
  AttachmentRepository,
  AuditAttachmentSyncConsumer,
} from "@/features/attachments";

export const container = new Container({ defaultScope: "Singleton" });

container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.Broker).toConstantValue(broker);

container.bind<IAuditLogRepository>(TYPES.AuditLogRepository).to(AuditLogRepository);
container.bind<IAuditLogService>(TYPES.AuditLogService).to(AuditLogService);
container.bind<IIdentityRepository>(TYPES.IdentityRepository).to(IdentityRepository);
container.bind<ISpaceRepository>(TYPES.SpaceRepository).to(SpaceRepository);
container.bind<IItemRepository>(TYPES.ItemRepository).to(ItemRepository);
container.bind<IWorkspaceRepository>(TYPES.WorkspaceRepository).to(WorkspaceRepository);
container.bind<IAttachmentRepository>(TYPES.AttachmentRepository).to(AttachmentRepository);

container
  .bind<IAuthorizationClient>(TYPES.AuthorizationClient)
  .toConstantValue(new HttpAuthorizationClient({ baseUrl: env.AUTHORIZATION_SERVICE_URL }));

container.bind(TYPES.AuditIdentitySyncConsumer).to(AuditIdentitySyncConsumer);
container.bind(TYPES.AuditItemsSyncConsumer).to(AuditItemsSyncConsumer);
container.bind(TYPES.AuditPlatformSyncConsumer).to(AuditPlatformSyncConsumer);
container.bind(TYPES.AuditAttachmentSyncConsumer).to(AuditAttachmentSyncConsumer);

export const bindHttpServer = async (): Promise<void> => {
  const { schema } = await import("@/graphql/schema");

  container.bind<IHttpServer>(TYPES.HttpServer).toConstantValue(
    createHttpServer({
      config: {
        host: "0.0.0.0",
        port: 5007,
        environment: env.NODE_ENV,
        version: 1,
      },
      https: {
        key: readFileSync(env.AUDIT_SERVICE_TLS_KEY_PATH),
        cert: readFileSync(env.AUDIT_SERVICE_TLS_CERT_PATH),
        ca: readFileSync(env.CA_CERT_PATH),
        requestCert: true,
        rejectUnauthorized: true,
      },
      cookie: { secret: env.JWT_SECRET },
      hooks: {
        onRequest: [resolveIdentityFromHeaders, resolveTenantContextFromHeaders],
      },
      graphql: createGraphQLServer({
        schema,
        context: createContext,
      }),
      routes: [],
    }),
  );
};
