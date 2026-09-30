import type { IAttachmentClient } from "@pine/attachment";
import type { ILogger } from "@pine/server";
import { inject, injectable } from "inversify";
import sharp from "sharp";
import { TYPES } from "@/bootstrap/container-types";
import type {
  IMetadataProcessingService,
  ProcessMetadataInput,
} from "./IMetadataProcessingService";

const isUint8Array = (value: unknown): value is Uint8Array => {
  return value instanceof Uint8Array;
};

const streamToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else if (isUint8Array(chunk)) {
      chunks.push(Buffer.from(chunk));
    }
  }
  return Buffer.concat(chunks);
};

@injectable()
export class MetadataProcessingService implements IMetadataProcessingService {
  constructor(
    @inject(TYPES.AttachmentClient)
    private readonly attachmentClient: IAttachmentClient,
    @inject(TYPES.Logger)
    private readonly logger: ILogger,
  ) {}

  async process(input: ProcessMetadataInput): Promise<void> {
    this.logger.info(`Extracting image metadata for: ${input.attachmentId}`);

    const stream = await this.attachmentClient.downloadStream({
      attachmentId: input.attachmentId,
      versionId: input.versionId,
    });

    const buffer = await streamToBuffer(stream);
    const metadata = await sharp(buffer).metadata();

    await this.attachmentClient.storeMetadata({
      attachmentId: input.attachmentId,
      versionId: input.versionId,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        extractedAt: new Date().toISOString(),
      },
    });

    this.logger.info(
      `Extracted and stored image metadata for: ${input.attachmentId} (${metadata.width ?? 0}x${metadata.height ?? 0})`,
    );
  }
}
