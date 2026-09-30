import type { AttachmentMetadata, NewAttachmentMetadata } from "@/db";

export type AttachmentMetadataRepositoryOptions = { tx?: unknown };

export interface IAttachmentMetadataRepository {
  save: (
    entity: NewAttachmentMetadata,
    options?: AttachmentMetadataRepositoryOptions,
  ) => Promise<AttachmentMetadata>;
  findByVersionId: (
    attachmentId: string,
    versionId: string,
    options?: AttachmentMetadataRepositoryOptions,
  ) => Promise<AttachmentMetadata | null>;
}
