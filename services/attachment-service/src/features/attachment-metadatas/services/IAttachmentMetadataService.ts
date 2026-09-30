import type { AttachmentMetadata, DbClient } from "@/db";

export type StoreAttachmentMetadataInput = {
  attachmentId: string;
  versionId: string;
  width?: number;
  height?: number;
  format?: string;
  space?: string;
  channels?: number;
  density?: number;
  hasAlpha?: boolean;
  orientation?: number;
  extractedAt: string;
  tx?: DbClient;
};

export type GetAttachmentMetadataInput = {
  attachmentId: string;
  versionId: string;
};

export interface IAttachmentMetadataService {
  store: (input: StoreAttachmentMetadataInput) => Promise<AttachmentMetadata>;
  getByVersionId: (input: GetAttachmentMetadataInput) => Promise<AttachmentMetadata>;
}
