import type { IAttachmentClient } from "@pine/attachment";
import type { ILogger } from "@pine/server";
import { inject, injectable } from "inversify";
import sharp from "sharp";
import { TYPES } from "@/bootstrap/container-types";
import { THUMBNAIL_SIZES, type ThumbnailSizeName } from "../constants";
import type {
  GeneratedThumbnail,
  IThumbnailProcessingService,
  ProcessThumbnailInput,
} from "./IThumbnailProcessingService";

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
export class ThumbnailProcessingService implements IThumbnailProcessingService {
  constructor(
    @inject(TYPES.AttachmentClient)
    private readonly attachmentClient: IAttachmentClient,
    @inject(TYPES.Logger)
    private readonly logger: ILogger,
  ) {}

  async process(input: ProcessThumbnailInput): Promise<void> {
    this.logger.info(`Processing thumbnail and preview for image: ${input.attachmentId}`);

    const stream = await this.attachmentClient.downloadStream({
      attachmentId: input.attachmentId,
      versionId: input.versionId,
    });

    const originalBuffer = await streamToBuffer(stream);
    const derivatives = await this.generateSizes(originalBuffer);

    await Promise.all(
      derivatives.map(async (derivative) => {
        if (!derivative.buffer) {
          return;
        }

        await this.attachmentClient.storeDerivative({
          attachmentId: input.attachmentId,
          versionId: input.versionId,
          derivativeType: derivative.sizeName,
          data: derivative.buffer,
          contentType: "image/png",
          width: derivative.width,
          height: derivative.height,
        });

        this.logger.info(
          `Stored ${derivative.sizeName} derivative for image: ${input.attachmentId} (${derivative.width}x${derivative.height})`,
        );
      }),
    );
  }

  async generateSizes(input: Buffer): Promise<GeneratedThumbnail[]> {
    const sizeNames: ThumbnailSizeName[] = ["thumbnail", "preview"];

    return Promise.all(
      sizeNames.map(async (sizeName) => {
        const config = THUMBNAIL_SIZES[sizeName];
        const resized = sharp(input).resize(config.width, config.height, {
          fit: "inside",
          withoutEnlargement: true,
        });
        const buffer = await resized.png().toBuffer();
        const metadata = await sharp(buffer).metadata();

        return {
          sizeName,
          width: metadata.width ?? config.width,
          height: metadata.height ?? config.height,
          buffer,
        };
      }),
    );
  }
}
