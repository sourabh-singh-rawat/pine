export interface ProcessImageInput {
  attachmentId: string;
  versionId: string;
  mimeType: string;
  scopeType?: string;
  scopeId?: string;
  tenantId?: string;
  url?: string;
}

export interface IImageProcessingService {
  process: (input: ProcessImageInput) => Promise<void>;
}
