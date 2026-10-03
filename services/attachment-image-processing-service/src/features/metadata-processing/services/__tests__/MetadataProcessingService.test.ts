import { Readable } from "node:stream";
import type { IAttachmentClient } from "@pine/attachment";
import type { ILogger } from "@pine/server";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { MetadataProcessingService } from "../MetadataProcessingService";

describe("MetadataProcessingService", () => {
  it("downloads image stream, extracts metadata, and calls attachmentClient.storeMetadata", async () => {
    const logInfo = vi.fn();
    const logger: ILogger = {
      info: logInfo,
      error: vi.fn(),
    };

    const testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const downloadStream = vi.fn().mockResolvedValue(Readable.from(testImageBuffer));
    const storeMetadata = vi.fn().mockResolvedValue({
      metadataId: "meta-1",
      attachmentId: "att-200",
      versionId: "ver-200",
      width: 800,
      height: 600,
      format: "png",
      extractedAt: new Date().toISOString(),
    });

    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream,
      storeDerivative: vi.fn(),
      storeMetadata,
      updateSecurityStatus: vi.fn(),
    };

    const service = new MetadataProcessingService(attachmentClient, logger);

    await service.process({
      attachmentId: "att-200",
      versionId: "ver-200",
      mimeType: "image/png",
    });

    expect(downloadStream).toHaveBeenCalledWith({
      attachmentId: "att-200",
      versionId: "ver-200",
    });

    expect(storeMetadata).toHaveBeenCalledTimes(1);
    expect(storeMetadata).toHaveBeenCalledWith({
      attachmentId: "att-200",
      versionId: "ver-200",
      metadata: expect.objectContaining({
        width: 800,
        height: 600,
        format: "png",
      }),
    });
  });
});
