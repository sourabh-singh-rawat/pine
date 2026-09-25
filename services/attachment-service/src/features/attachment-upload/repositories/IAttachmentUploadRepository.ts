import type { AttachmentUpload, DbClient, NewAttachmentUpload } from "@/db";

export type AttachmentUploadRepositoryOptions = { tx?: DbClient };

export interface IAttachmentUploadRepository {
  save: (
    entity: NewAttachmentUpload,
    options?: AttachmentUploadRepositoryOptions,
  ) => Promise<AttachmentUpload>;
  findById: (
    id: string,
    options?: AttachmentUploadRepositoryOptions,
  ) => Promise<AttachmentUpload | null>;
  markCompleted: (id: string, options?: AttachmentUploadRepositoryOptions) => Promise<void>;
  markFailed: (id: string, options?: AttachmentUploadRepositoryOptions) => Promise<void>;
}
