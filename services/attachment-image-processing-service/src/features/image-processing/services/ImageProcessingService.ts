import type { ILogger } from "@pine/server";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { IMetadataProcessingService } from "@/features/metadata-processing";
import type { IThumbnailProcessingService } from "@/features/thumbnail-processing";
import type { IImageProcessingService, ProcessImageInput } from "./IImageProcessingService";

@injectable()
export class ImageProcessingService implements IImageProcessingService {
  constructor(
    @inject(TYPES.ThumbnailProcessingService)
    private readonly thumbnailProcessingService: IThumbnailProcessingService,
    @inject(TYPES.MetadataProcessingService)
    private readonly metadataProcessingService: IMetadataProcessingService,
    @inject(TYPES.Logger)
    private readonly logger: ILogger,
  ) {}

  async process(input: ProcessImageInput): Promise<void> {
    this.logger.info(`Processing image: ${input.attachmentId} (${input.mimeType})`);
    await Promise.all([
      this.thumbnailProcessingService.process(input),
      this.metadataProcessingService.process(input),
    ]);
  }
}
