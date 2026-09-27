import { HttpAttachmentClient, type IAttachmentClient } from "@pine/attachment";
import { type IPublisher, NatsPublisher } from "@pine/events";
import type { ILogger } from "@pine/server";
import { Container } from "inversify";
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { env } from "@/bootstrap/env";
import { logger } from "@/bootstrap/logger";
import { AttachmentImageMetadataConsumer, MetadataProcessingService, type IMetadataProcessingService } from "@/features/metadata-processing";
import { AttachmentImageThumbnailConsumer, ThumbnailProcessingService, type IThumbnailProcessingService } from "@/features/thumbnail-processing";

export const container = new Container({ defaultScope: "Singleton" });

container.bind<ILogger>(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.Broker).toConstantValue(broker);

const publisher = new NatsPublisher(broker);
container.bind<IPublisher>(TYPES.Publisher).toConstantValue(publisher);

const attachmentClient = new HttpAttachmentClient({
  baseUrl: env.ATTACHMENT_SERVICE_URL,
});
container.bind<IAttachmentClient>(TYPES.AttachmentClient).toConstantValue(attachmentClient);

container.bind<IThumbnailProcessingService>(TYPES.ThumbnailProcessingService).to(ThumbnailProcessingService);
container.bind<IMetadataProcessingService>(TYPES.MetadataProcessingService).to(MetadataProcessingService);
container.bind<AttachmentImageThumbnailConsumer>(TYPES.AttachmentImageThumbnailConsumer).to(AttachmentImageThumbnailConsumer);
container.bind<AttachmentImageMetadataConsumer>(TYPES.AttachmentImageMetadataConsumer).to(AttachmentImageMetadataConsumer);
