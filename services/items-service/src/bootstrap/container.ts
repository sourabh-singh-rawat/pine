import { HttpAttachmentClient, type IAttachmentClient } from "@pine/attachment";
import { HttpAuthorizationClient, type IAuthorizationClient } from "@pine/authorization";
import { NatsPublisher, type IPublisher } from "@pine/events";
import { resolveIdentityFromHeaders, resolveTenantContextFromHeaders } from "@pine/identity";
import { createGraphQLServer, createHttpServer, type IHttpServer } from "@pine/server";
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
import { Container } from "inversify";
import { readFileSync } from "node:fs";
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { db } from "@/bootstrap/db";
import { env } from "@/bootstrap/env";
import { logger } from "@/bootstrap/logger";
import { createContext } from "@/graphql";
import { IIdentityRepository, IdentityRepository, ItemsIdentitySyncConsumer } from "@/features/identities";
import {
  IItemAttachmentRepository,
  IItemAttachmentService,
  IItemAttachmentUploadRequestRepository,
  ItemAttachmentCreatedConsumer,
  ItemAttachmentRepository,
  ItemAttachmentService,
  ItemAttachmentUploadRequestRepository,
} from "@/features/attachments";
import {
  ChecklistEntryRepository,
  ChecklistRepository,
  ChecklistService,
  IChecklistEntryRepository,
  IChecklistRepository,
  IChecklistService,
} from "@/features/checklists";
import { IItemAssigneeRepository, IItemRepository, IItemService, ItemAssigneeRepository, ItemRepository, ItemService } from "@/features/item";
import { IListRepository, IListService, ListRepository, ListService } from "@/features/lists";
import { ISpaceRepository, ISpaceService, SpaceRepository, SpaceService } from "@/features/spaces";
import { IStatusRepository, IStatusService, StatusRepository, StatusService } from "@/features/item-statuses";
import { ISubItemService, SubItemService } from "@/features/sub-items";

export const container = new Container({ defaultScope: "Singleton" });

container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.Broker).toConstantValue(broker);
container.bind<IPublisher>(TYPES.Publisher).toConstantValue(new NatsPublisher(broker));
container.bind<IOutboxRepository>(TYPES.OutboxRepository).toConstantValue(new OutboxRepository(db));
container.bind<IRetryPolicy>(TYPES.RetryPolicy).toConstantValue(new ExponentialBackoffPolicy());
container
  .bind<IOutboxService>(TYPES.OutboxService)
  .toConstantValue(new OutboxService(container.get<IOutboxRepository>(TYPES.OutboxRepository), container.get<IRetryPolicy>(TYPES.RetryPolicy)));
container
  .bind<IOutboxWorker>(TYPES.OutboxWorker)
  .toConstantValue(new OutboxWorker(container.get<IOutboxService>(TYPES.OutboxService), container.get<IPublisher>(TYPES.Publisher) as IOutboxPublisher));
container
  .bind<IOutboxCleanupService>(TYPES.OutboxCleanupService)
  .toConstantValue(new OutboxCleanupService(container.get<IOutboxRepository>(TYPES.OutboxRepository)));
container
  .bind<IOutboxCleanupWorker>(TYPES.OutboxCleanupWorker)
  .toConstantValue(new OutboxCleanupWorker(container.get<IOutboxCleanupService>(TYPES.OutboxCleanupService)));

container.bind<IIdentityRepository>(TYPES.IdentityRepository).to(IdentityRepository);
container.bind<IItemRepository>(TYPES.ItemRepository).to(ItemRepository);
container.bind<IItemAssigneeRepository>(TYPES.ItemAssigneeRepository).to(ItemAssigneeRepository);
container.bind<IItemAttachmentRepository>(TYPES.ItemAttachmentRepository).to(ItemAttachmentRepository);
container.bind<IItemAttachmentUploadRequestRepository>(TYPES.ItemAttachmentUploadRequestRepository).to(ItemAttachmentUploadRequestRepository);
container.bind<IItemService>(TYPES.ItemService).to(ItemService);
container.bind<ISubItemService>(TYPES.SubItemService).to(SubItemService);
container.bind<IItemAttachmentService>(TYPES.ItemAttachmentService).to(ItemAttachmentService);
container.bind<IChecklistRepository>(TYPES.ChecklistRepository).to(ChecklistRepository);
container.bind<IChecklistEntryRepository>(TYPES.ChecklistEntryRepository).to(ChecklistEntryRepository);
container.bind<IChecklistService>(TYPES.ChecklistService).to(ChecklistService);
container.bind<IStatusRepository>(TYPES.StatusRepository).to(StatusRepository);
container.bind<IStatusService>(TYPES.StatusService).to(StatusService);
container.bind<IListRepository>(TYPES.ListRepository).to(ListRepository);
container.bind<IListService>(TYPES.ListService).to(ListService);
container.bind<ISpaceRepository>(TYPES.SpaceRepository).to(SpaceRepository);
container.bind<ISpaceService>(TYPES.SpaceService).to(SpaceService);
container.bind<IAuthorizationClient>(TYPES.AuthorizationClient).toConstantValue(new HttpAuthorizationClient({ baseUrl: env.AUTHORIZATION_SERVICE_URL }));
container.bind<IAttachmentClient>(TYPES.AttachmentClient).toConstantValue(new HttpAttachmentClient({ baseUrl: env.ATTACHMENT_SERVICE_URL }));
container.bind<ItemsIdentitySyncConsumer>(TYPES.ItemsIdentitySyncConsumer).to(ItemsIdentitySyncConsumer);
container.bind<ItemAttachmentCreatedConsumer>(TYPES.ItemAttachmentCreatedConsumer).to(ItemAttachmentCreatedConsumer);

export const bindHttpServer = async (): Promise<void> => {
  const { schema } = await import("@/graphql/schema");

  container.bind<IHttpServer>(TYPES.HttpServer).toConstantValue(
    createHttpServer({
      config: {
        host: "0.0.0.0",
        port: 5001,
        environment: env.NODE_ENV,
        version: 1,
      },
      https: {
        key: readFileSync(env.ITEMS_SERVICE_TLS_KEY_PATH),
        cert: readFileSync(env.ITEMS_SERVICE_TLS_CERT_PATH),
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
