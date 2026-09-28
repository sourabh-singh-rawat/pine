import { Readable } from "node:stream";
import type { IAttachmentClient } from "@pine/attachment";
import type { ILogger } from "@pine/server";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { ThumbnailProcessingService } from "../ThumbnailProcessingService";

describe("ThumbnailProcessingService", () => {
  it("downloads stream, generates sizes, and uploads derivatives to attachment client", async () => {
    const logInfo = vi.fn();
    const logger: ILogger = {
      info: logInfo,
    };

    const testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const downloadStream = vi.fn().mockResolvedValue(Readable.from(testImageBuffer));
    const storeDerivative = vi.fn().mockResolvedValue({
      derivativeId: "der-1",
      attachmentId: "att-100",
      versionId: "ver-100",
      derivativeType: "thumbnail",
      mimeType: "image/avif",
      fileSize: 100,
      width: 256,
      height: 192,
    });

    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream,
      storeDerivative,
      storeMetadata: vi.fn(),
      updateSecurityStatus: vi.fn(),
    };

    const service = new ThumbnailProcessingService(attachmentClient, logger);

    await service.process({
      attachmentId: "att-100",
      versionId: "ver-100",
      mimeType: "image/png",
    });

    expect(downloadStream).toHaveBeenCalledWith({
      attachmentId: "att-100",
      versionId: "ver-100",
    });

    expect(storeDerivative).toHaveBeenCalledTimes(2);
    expect(storeDerivative).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentId: "att-100",
        versionId: "ver-100",
        derivativeType: "thumbnail",
        contentType: "image/avif",
      }),
    );
    expect(storeDerivative).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentId: "att-100",
        versionId: "ver-100",
        derivativeType: "preview",
        contentType: "image/avif",
      }),
    );
  }, 20_000);

  it("generates thumbnail and preview sizes from image buffer", async () => {
    const logInfo = vi.fn();
    const logger: ILogger = {
      info: logInfo,
    };

    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream: vi.fn(),
      storeDerivative: vi.fn(),
      storeMetadata: vi.fn(),
      updateSecurityStatus: vi.fn(),
    };

    const service = new ThumbnailProcessingService(attachmentClient, logger);

    const testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const results = await service.generateSizes(testImageBuffer);

    expect(results).toHaveLength(2);

    const thumbnail = results.find((r) => r.sizeName === "thumbnail");
    const preview = results.find((r) => r.sizeName === "preview");

    expect(thumbnail).toBeDefined();
    expect(thumbnail?.width).toBeLessThanOrEqual(256);
    expect(thumbnail?.height).toBeLessThanOrEqual(256);
    expect(thumbnail?.buffer).toBeDefined();

    if (thumbnail?.buffer) {
      const metadata = await sharp(thumbnail.buffer).metadata();
      expect(metadata.format).toBe("heif");
      expect(metadata.compression).toBe("av1");
    }

    expect(preview).toBeDefined();
    expect(preview?.width).toBeLessThanOrEqual(1200);
    expect(preview?.height).toBeLessThanOrEqual(1200);
    expect(preview?.buffer).toBeDefined();

    if (preview?.buffer) {
      const metadata = await sharp(preview.buffer).metadata();
      expect(metadata.format).toBe("heif");
      expect(metadata.compression).toBe("av1");
    }
  }, 20_000);
});
