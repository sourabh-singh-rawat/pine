import { NatsPublisher, type IPublisher } from "@pine/events";
import { resolveIdentityFromHeaders, resolveTenantContextFromHeaders } from "@pine/identity";
import {
  ExponentialBackoffPolicy,
  OutboxCleanupService,
  OutboxCleanupWorker,
  OutboxRepository,
  OutboxService,
  OutboxWorker,
  type IOutboxCleanupService,
  type IOutboxCleanupWorker,
  type IOutboxPublisher,
  type IOutboxRepository,
  type IOutboxService,
  type IOutboxWorker,
  type IRetryPolicy,
} from "@pine/outbox";
import { createGraphQLServer, createHttpServer, type IHttpServer } from "@pine/server";
import { Container } from "inversify";
import { readFileSync } from "node:fs";
import path from "node:path";
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { db } from "@/bootstrap/db";
import { env } from "@/bootstrap/env";
import { logger } from "@/bootstrap/logger";
import { imageProcessingQueue } from "@/bootstrap/queue";
import { redisClient } from "@/bootstrap/redis-client";
import { AttachmentRepository, AttachmentScannedConsumer, AttachmentService, IAttachmentRepository, IAttachmentService } from "@/features/attachment";
import { AttachmentUploadRepository, AttachmentUploadService, IAttachmentUploadRepository, IAttachmentUploadService } from "@/features/attachment-upload";
import { AttachmentIdentitySyncConsumer, IIdentityRepository, IdentityRepository } from "@/features/identities";
import { AttachmentTenantSyncConsumer, ITenantRepository, TenantRepository } from "@/features/tenants";
import { createContext } from "@/graphql";
import { IObjectStorage, SeaweedObjectStorage } from "@/integrations/storage";
import { routes } from "@/routes";

export const container = new Container({ defaultScope: "Singleton" });

const publisher = new NatsPublisher(broker);

container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.Broker).toConstantValue(broker);
container.bind(TYPES.RedisClient).toConstantValue(redisClient);
container.bind(TYPES.ImageProcessingQueue).toConstantValue(imageProcessingQueue);

container.bind<IPublisher>(TYPES.Publisher).toConstantValue(publisher);
container.bind<IOutboxRepository>(TYPES.OutboxRepository).toConstantValue(new OutboxRepository(db));
container.bind<IRetryPolicy>(TYPES.RetryPolicy).toConstantValue(new ExponentialBackoffPolicy());
container
  .bind<IOutboxService>(TYPES.OutboxService)
  .toConstantValue(new OutboxService(container.get<IOutboxRepository>(TYPES.OutboxRepository), container.get<IRetryPolicy>(TYPES.RetryPolicy)));
container
  .bind<IOutboxWorker>(TYPES.OutboxWorker)
  .toConstantValue(new OutboxWorker(container.get<IOutboxService>(TYPES.OutboxService), publisher satisfies IOutboxPublisher));
container
  .bind<IOutboxCleanupService>(TYPES.OutboxCleanupService)
  .toConstantValue(new OutboxCleanupService(container.get<IOutboxRepository>(TYPES.OutboxRepository)));
container
  .bind<IOutboxCleanupWorker>(TYPES.OutboxCleanupWorker)
  .toConstantValue(new OutboxCleanupWorker(container.get<IOutboxCleanupService>(TYPES.OutboxCleanupService)));

container.bind<IIdentityRepository>(TYPES.IdentityRepository).to(IdentityRepository);
container.bind<ITenantRepository>(TYPES.TenantRepository).to(TenantRepository);
container.bind<IAttachmentRepository>(TYPES.AttachmentRepository).to(AttachmentRepository);
container.bind<IAttachmentUploadRepository>(TYPES.AttachmentUploadRepository).to(AttachmentUploadRepository);
container.bind<IObjectStorage>(TYPES.ObjectStorage).to(SeaweedObjectStorage);
container.bind<IAttachmentUploadService>(TYPES.AttachmentUploadService).to(AttachmentUploadService);
container.bind<IAttachmentService>(TYPES.AttachmentService).to(AttachmentService);
container.bind<AttachmentIdentitySyncConsumer>(TYPES.AttachmentIdentitySyncConsumer).to(AttachmentIdentitySyncConsumer);
container.bind<AttachmentTenantSyncConsumer>(TYPES.AttachmentTenantSyncConsumer).to(AttachmentTenantSyncConsumer);
container.bind<AttachmentScannedConsumer>(TYPES.AttachmentScannedConsumer).to(AttachmentScannedConsumer);

export const bindHttpServer = async (): Promise<void> => {
  const { schema } = await import("@/graphql/schema");

  container.bind<IHttpServer>(TYPES.HttpServer).toConstantValue(
    createHttpServer({
      config: {
        host: "0.0.0.0",
        port: 5003,
        environment: env.NODE_ENV,
        version: 1,
      },
      https: {
        key: readFileSync(env.ATTACHMENT_SERVICE_TLS_KEY_PATH),
        cert: readFileSync(env.ATTACHMENT_SERVICE_TLS_CERT_PATH),
        ca: readFileSync(env.CA_CERT_PATH),
        requestCert: true,
        rejectUnauthorized: true,
      },
      cookie: { secret: env.JWT_SECRET },
      cors: {
        credentials: true,
        origin: [env.PINE_WEB_URL, env.IDENTITY_WEB_URL, env.VITE_PLATFORM_WEB_URL],
        methods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
      },
      multipart: { fileSize: 32000000 },
      openapi: {
        info: {
          title: "Attachment Service",
          version: "0.0.1",
          license: {
            name: "ISC",
            url: "https://opensource.org/license/isc-license-txt",
          },
        },
        servers: [{ url: env.ATTACHMENT_SERVICE_URL }],
        tags: [{ name: "attachment", description: "Attachment related end-points" }],
      },
      hooks: {
        onRequest: [resolveIdentityFromHeaders, resolveTenantContextFromHeaders],
      },
      graphql: createGraphQLServer({
        schema,
        context: createContext,
      }),
      routes,
    }),
  );
};

export const openApiOutputPath = path.join(process.cwd(), "dist", "openapi.json");
