import type { IAttachmentClient, UpdateSecurityStatusBody } from "@pine/attachment";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { IMalwareScannerService } from "@/features/malware-scanner/services";
import type { IAttachmentScannerService, ScanAttachmentInput } from "./IAttachmentScannerService";

@injectable()
export class AttachmentScannerService implements IAttachmentScannerService {
  constructor(
    @inject(TYPES.AttachmentClient)
    private readonly attachmentClient: IAttachmentClient,
    @inject(TYPES.MalwareScannerService)
    private readonly malwareScannerService: IMalwareScannerService,
  ) {}

  async scan(input: ScanAttachmentInput): Promise<void> {
    let status: UpdateSecurityStatusBody["status"];

    try {
      const stream = await this.attachmentClient.downloadStream({
        attachmentId: input.attachmentId,
        versionId: input.versionId,
      });

      const scanResult = await this.malwareScannerService.scan(stream);
      status = scanResult.isInfected ? "INFECTED" : "CLEAN";
    } catch {
      status = "FAILED";
    }

    await this.attachmentClient.updateSecurityStatus({
      attachmentId: input.attachmentId,
      status,
    });
  }
}
