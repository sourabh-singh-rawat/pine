import { Readable } from "node:stream";
import type { IAttachmentClient } from "@pine/attachment";
import type { CloudEvent, IPublisher } from "@pine/events";
import type { ILogger } from "@pine/server";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { MetadataProcessingService } from "../MetadataProcessingService";

describe("MetadataProcessingService", () => {
  it("downloads image stream, extracts metadata, and publishes metadata event", async () => {
    const logInfo = vi.fn();
    const logger: ILogger = {
      info: logInfo,
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
    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream,
      storeDerivative: vi.fn(),
      updateSecurityStatus: vi.fn(),
    };

    const sendEvent = vi.fn().mockResolvedValue(undefined);
    const publisher: IPublisher = {
      send: sendEvent,
    };

    const service = new MetadataProcessingService(attachmentClient, publisher, logger);

    await service.process({
      attachmentId: "att-200",
      versionId: "ver-200",
      mimeType: "image/png",
    });

    expect(downloadStream).toHaveBeenCalledWith({
      attachmentId: "att-200",
      versionId: "ver-200",
    });

    expect(sendEvent).toHaveBeenCalledTimes(1);
    const publishedEvent = sendEvent.mock.calls[0]?.[0] as unknown as CloudEvent<{
      attachmentId: string;
      versionId: string;
      width?: number;
      height?: number;
    }>;
    expect(publishedEvent.type).toBe("attachment.image.metadata-extracted");
    expect(publishedEvent.data?.attachmentId).toBe("att-200");
    expect(publishedEvent.data?.versionId).toBe("ver-200");
    expect(publishedEvent.data?.width).toBe(800);
    expect(publishedEvent.data?.height).toBe(600);
  });
});
