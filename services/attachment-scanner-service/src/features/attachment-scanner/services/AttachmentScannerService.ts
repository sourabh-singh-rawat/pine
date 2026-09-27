import { uuidv7 } from "@pine/common";
import type { IAttachmentClient } from "@pine/attachment";
import {
  type AttachmentScannedData,
  AttachmentScannedEvent,
  type CloudEvent,
  createCloudEvent,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { ATTACHMENT_SCAN_TYPE, MALWARE_ATTACHMENT_SCAN_STATUS } from "@/constants";
import type { AttachmentScan, DbClient } from "@/db";
import type { IAttachmentScanRepository } from "@/features/attachment-scanner/repositories";
import type { IMalwareScannerService } from "@/features/malware-scanner/services";
import type { IAttachmentScannerService, ScanAttachmentInput } from "./IAttachmentScannerService";

export type ScannerDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

@injectable()
export class AttachmentScannerService implements IAttachmentScannerService {
  constructor(
    @inject(TYPES.AttachmentScanRepository)
    private readonly scanRepository: IAttachmentScanRepository,
    @inject(TYPES.AttachmentClient)
    private readonly attachmentClient: IAttachmentClient,
    @inject(TYPES.MalwareScannerService)
    private readonly malwareScannerService: IMalwareScannerService,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: ScannerDatabase,
  ) {}

  async scan(input: ScanAttachmentInput): Promise<AttachmentScan> {
    const scan = await this.scanRepository.save({
      id: uuidv7(),
      attachmentId: input.attachmentId,
      versionId: input.versionId,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      tenantId: input.tenantId,
      type: ATTACHMENT_SCAN_TYPE.MALWARE,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.SCANNING,
    });

    const startTime = Date.now();

    try {
      const stream = await this.attachmentClient.downloadStream({
        attachmentId: input.attachmentId,
        versionId: input.versionId,
      });

      const scanResult = await this.malwareScannerService.scan(stream);
      const durationMs = Date.now() - startTime;
      const status = scanResult.isInfected
        ? MALWARE_ATTACHMENT_SCAN_STATUS.INFECTED
        : MALWARE_ATTACHMENT_SCAN_STATUS.CLEAN;

      return await this.db.transaction(async (tx) => {
        const updated = await this.scanRepository.updateResult(
          scan.id,
          {
            status,
            scanner: "clamav",
            durationMs,
            result: {
              isInfected: scanResult.isInfected,
              threats: scanResult.viruses,
              rawOutput: scanResult.rawResponse,
            },
          },
          { tx },
        );

        const event: CloudEvent<AttachmentScannedData> = createCloudEvent({
          type: AttachmentScannedEvent.type,
          version: AttachmentScannedEvent.version,
          schema: AttachmentScannedEvent.schema,
          source: "pine/attachment-scanner-service",
          subject: input.attachmentId,
          data: {
            scanId: scan.id,
            attachmentId: input.attachmentId,
            versionId: input.versionId,
            scopeType: input.scopeType,
            scopeId: input.scopeId,
            ...(input.tenantId ? { tenantId: input.tenantId } : {}),
            type: ATTACHMENT_SCAN_TYPE.MALWARE,
            status,
            scanner: "clamav",
            durationMs,
            result: {
              isInfected: scanResult.isInfected,
              threats: scanResult.viruses,
              ...(scanResult.rawResponse ? { rawOutput: scanResult.rawResponse } : {}),
            },
            scannedAt: new Date().toISOString(),
          },
        });

        await this.outboxService.schedule(
          {
            eventId: event.id,
            eventType: event.type,
            eventVersion: AttachmentScannedEvent.version,
            aggregateType: "attachment_scan",
            aggregateId: scan.id,
            payload: event,
          },
          { tx },
        );

        return updated ?? scan;
      });
    } catch {
      const durationMs = Date.now() - startTime;
      await this.db.transaction(async (tx) => {
        await this.scanRepository.updateResult(
          scan.id,
          {
            status: MALWARE_ATTACHMENT_SCAN_STATUS.FAILED,
            durationMs,
          },
          { tx },
        );

        const event: CloudEvent<AttachmentScannedData> = createCloudEvent({
          type: AttachmentScannedEvent.type,
          version: AttachmentScannedEvent.version,
          schema: AttachmentScannedEvent.schema,
          source: "pine/attachment-scanner-service",
          subject: input.attachmentId,
          data: {
            scanId: scan.id,
            attachmentId: input.attachmentId,
            versionId: input.versionId,
            scopeType: input.scopeType,
            scopeId: input.scopeId,
            ...(input.tenantId ? { tenantId: input.tenantId } : {}),
            type: ATTACHMENT_SCAN_TYPE.MALWARE,
            status: MALWARE_ATTACHMENT_SCAN_STATUS.FAILED,
            durationMs,
            scannedAt: new Date().toISOString(),
          },
        });

        await this.outboxService.schedule(
          {
            eventId: event.id,
            eventType: event.type,
            eventVersion: AttachmentScannedEvent.version,
            aggregateType: "attachment_scan",
            aggregateId: scan.id,
            payload: event,
          },
          { tx },
        );
      });

      return scan;
    }
  }
}
