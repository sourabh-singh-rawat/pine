import { HttpAttachmentClient, type IAttachmentClient } from "@pine/attachment";
import { Container } from "inversify";
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { env } from "@/bootstrap/env";
import { logger } from "@/bootstrap/logger";
import { AttachmentQuarantinedConsumer, AttachmentScannerService, type IAttachmentScannerService } from "@/features/attachment-scanner";
import { type IMalwareScannerService, MalwareScannerService } from "@/features/malware-scanner";
import { ClamClient, ClamMalwareScanner, type IMalwareScanner } from "@/integrations/malware-scanner";

export const container = new Container({ defaultScope: "Singleton" });

container.bind(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.Broker).toConstantValue(broker);

const clamClient = new ClamClient({
  host: env.CLAMAV_HOST,
  port: env.CLAMAV_PORT,
  timeoutMs: env.CLAMAV_TIMEOUT_MS,
});
container.bind<ClamClient>(TYPES.ClamClient).toConstantValue(clamClient);

const attachmentClient = new HttpAttachmentClient({
  baseUrl: env.ATTACHMENT_SERVICE_URL,
});
container.bind<IAttachmentClient>(TYPES.AttachmentClient).toConstantValue(attachmentClient);

container.bind<IMalwareScanner>(TYPES.MalwareScanner).to(ClamMalwareScanner);
container.bind<IMalwareScannerService>(TYPES.MalwareScannerService).to(MalwareScannerService);
container.bind<IAttachmentScannerService>(TYPES.AttachmentScannerService).to(AttachmentScannerService);
container.bind<AttachmentQuarantinedConsumer>(TYPES.AttachmentQuarantinedConsumer).to(AttachmentQuarantinedConsumer);
