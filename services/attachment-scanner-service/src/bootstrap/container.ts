import { HttpAttachmentClient, type IAttachmentClient } from "@pine/attachment";
import { NatsPublisher, type IPublisher } from "@pine/events";
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
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { db } from "@/bootstrap/db";
import { env } from "@/bootstrap/env";
import { logger } from "@/bootstrap/logger";
import {
  AttachmentQuarantinedConsumer,
  AttachmentScannerService,
  AttachmentScanRepository,
  type IAttachmentScannerService,
  type IAttachmentScanRepository,
} from "@/features/attachment-scanner";
import { type IMalwareScannerService, MalwareScannerService } from "@/features/malware-scanner";
import { ClamClient, ClamMalwareScanner, type IMalwareScanner } from "@/integrations/malware-scanner";

export const container = new Container({ defaultScope: "Singleton" });

const publisher = new NatsPublisher(broker);

container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.Broker).toConstantValue(broker);

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

const clamClient = new ClamClient({
  host: env.CLAMAV_HOST,
  port: env.CLAMAV_PORT,
  timeoutMs: 30000,
});
container.bind<ClamClient>(TYPES.ClamClient).toConstantValue(clamClient);

const attachmentClient = new HttpAttachmentClient({
  baseUrl: env.ATTACHMENT_SERVICE_URL,
});
container.bind<IAttachmentClient>(TYPES.AttachmentClient).toConstantValue(attachmentClient);

container.bind<IMalwareScanner>(TYPES.MalwareScanner).to(ClamMalwareScanner);
container.bind<IMalwareScannerService>(TYPES.MalwareScannerService).to(MalwareScannerService);
container.bind<IAttachmentScanRepository>(TYPES.AttachmentScanRepository).to(AttachmentScanRepository);
container.bind<IAttachmentScannerService>(TYPES.AttachmentScannerService).to(AttachmentScannerService);
container.bind<AttachmentQuarantinedConsumer>(TYPES.AttachmentQuarantinedConsumer).to(AttachmentQuarantinedConsumer);
