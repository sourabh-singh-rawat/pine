import { Readable } from "node:stream";
import type { IAttachmentClient } from "@pine/attachment";
import { describe, expect, it, vi } from "vitest";
import type { IMalwareScannerService } from "@/features/malware-scanner/services";
import { AttachmentScannerService } from "../AttachmentScannerService";

describe("AttachmentScannerService", () => {
  it("scans a clean attachment and reports CLEAN", async () => {
    const stream = Readable.from(["file-content"]);
    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream: vi.fn().mockResolvedValue(stream),
      storeDerivative: vi.fn(),
      storeMetadata: vi.fn(),
      updateSecurityStatus: vi.fn().mockResolvedValue({
        attachmentId: "att-1",
        status: "AVAILABLE",
        securityStatus: "CLEAN",
      }),
    };

    const malwareScannerService: IMalwareScannerService = {
      scan: vi.fn().mockResolvedValue({
        isInfected: false,
        viruses: [],
        rawResponse: "stream: OK",
      }),
      ping: vi.fn().mockResolvedValue(true),
      version: vi.fn().mockResolvedValue("ClamAV 1.4.0"),
    };

    const service = new AttachmentScannerService(attachmentClient, malwareScannerService);

    await service.scan({
      attachmentId: "att-1",
      versionId: "ver-1",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
    });

    expect(attachmentClient.downloadStream).toHaveBeenCalledWith({
      attachmentId: "att-1",
      versionId: "ver-1",
    });
    expect(malwareScannerService.scan).toHaveBeenCalledWith(stream);
    expect(attachmentClient.updateSecurityStatus).toHaveBeenCalledWith({
      attachmentId: "att-1",
      status: "CLEAN",
    });
  });

  it("scans an infected attachment and reports INFECTED", async () => {
    const stream = Readable.from(["eicar-test-string"]);
    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream: vi.fn().mockResolvedValue(stream),
      storeDerivative: vi.fn(),
      storeMetadata: vi.fn(),
      updateSecurityStatus: vi.fn().mockResolvedValue({
        attachmentId: "att-2",
        status: "REJECTED",
        securityStatus: "INFECTED",
      }),
    };

    const malwareScannerService: IMalwareScannerService = {
      scan: vi.fn().mockResolvedValue({
        isInfected: true,
        viruses: ["Eicar-Signature"],
        rawResponse: "stream: Eicar-Signature FOUND",
      }),
      ping: vi.fn().mockResolvedValue(true),
      version: vi.fn().mockResolvedValue("ClamAV 1.4.0"),
    };

    const service = new AttachmentScannerService(attachmentClient, malwareScannerService);

    await service.scan({
      attachmentId: "att-2",
      versionId: "ver-2",
      scopeType: "WORKSPACE",
      scopeId: "org-1",
      tenantId: "tenant-1",
    });

    expect(attachmentClient.updateSecurityStatus).toHaveBeenCalledWith({
      attachmentId: "att-2",
      status: "INFECTED",
    });
  });

  it("reports FAILED when download or scanning fails", async () => {
    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream: vi.fn().mockRejectedValue(new Error("Network failure")),
      storeDerivative: vi.fn(),
      storeMetadata: vi.fn(),
      updateSecurityStatus: vi.fn().mockResolvedValue({
        attachmentId: "att-3",
        status: "REJECTED",
        securityStatus: "FAILED",
      }),
    };

    const malwareScannerService: IMalwareScannerService = {
      scan: vi.fn(),
      ping: vi.fn().mockResolvedValue(true),
      version: vi.fn().mockResolvedValue("ClamAV 1.4.0"),
    };

    const service = new AttachmentScannerService(attachmentClient, malwareScannerService);

    await service.scan({
      attachmentId: "att-3",
      versionId: "ver-3",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
    });

    expect(malwareScannerService.scan).not.toHaveBeenCalled();
    expect(attachmentClient.updateSecurityStatus).toHaveBeenCalledWith({
      attachmentId: "att-3",
      status: "FAILED",
    });
  });

  it("rethrows when reporting the security status fails", async () => {
    const stream = Readable.from(["file-content"]);
    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream: vi.fn().mockResolvedValue(stream),
      storeDerivative: vi.fn(),
      storeMetadata: vi.fn(),
      updateSecurityStatus: vi.fn().mockRejectedValue(new Error("attachment-service unavailable")),
    };

    const malwareScannerService: IMalwareScannerService = {
      scan: vi.fn().mockResolvedValue({
        isInfected: false,
        viruses: [],
        rawResponse: "stream: OK",
      }),
      ping: vi.fn().mockResolvedValue(true),
      version: vi.fn().mockResolvedValue("ClamAV 1.4.0"),
    };

    const service = new AttachmentScannerService(attachmentClient, malwareScannerService);

    await expect(
      service.scan({
        attachmentId: "att-4",
        versionId: "ver-4",
        scopeType: "IDENTITY",
        scopeId: "user-1",
      }),
    ).rejects.toThrow("attachment-service unavailable");
  });
});
