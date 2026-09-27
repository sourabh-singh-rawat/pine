import type { ThumbnailSizeName } from "../constants";

export interface ProcessThumbnailInput {
  attachmentId: string;
  versionId: string;
  mimeType: string;
  scopeType?: string;
  scopeId?: string;
  tenantId?: string;
  url?: string;
}

export interface GeneratedThumbnail {
  sizeName: ThumbnailSizeName;
  width: number;
  height: number;
  buffer?: Buffer;
}

export interface IThumbnailProcessingService {
  process: (input: ProcessThumbnailInput) => Promise<void>;
  generateSizes?: (input: Buffer) => Promise<GeneratedThumbnail[]>;
}
