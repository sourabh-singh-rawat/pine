import type { ILogger } from "@pine/server";
import { describe, expect, it, vi } from "vitest";
import type { IMetadataProcessingService } from "@/features/metadata-processing";
import type { IThumbnailProcessingService } from "@/features/thumbnail-processing";
import { ImageProcessingService } from "../ImageProcessingService";

describe("ImageProcessingService", () => {
  it("orchestrates thumbnail and metadata processing with logging", async () => {
    const processThumbnail = vi.fn().mockResolvedValue(undefined);
    const thumbnailProcessingService: IThumbnailProcessingService = {
      process: processThumbnail,
    };

    const processMetadata = vi.fn().mockResolvedValue(undefined);
    const metadataProcessingService: IMetadataProcessingService = {
      process: processMetadata,
    };

    const logInfo = vi.fn();
    const logger: ILogger = {
      info: logInfo,
    };

    const service = new ImageProcessingService(
      thumbnailProcessingService,
      metadataProcessingService,
      logger,
    );

    const input = {
      attachmentId: "att-123",
      versionId: "ver-456",
      mimeType: "image/png",
      scopeType: "IDENTITY",
      scopeId: "user-1",
    };

    await service.process(input);

    expect(logInfo).toHaveBeenCalledWith("Processing image: att-123 (image/png)");
    expect(processThumbnail).toHaveBeenCalledWith(input);
    expect(processMetadata).toHaveBeenCalledWith(input);
  });
});
