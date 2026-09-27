export interface ProcessMetadataInput {
  attachmentId: string;
  versionId: string;
  mimeType: string;
  scopeType?: string;
  scopeId?: string;
  tenantId?: string;
  url?: string;
}

export interface IMetadataProcessingService {
  process: (input: ProcessMetadataInput) => Promise<void>;
}
