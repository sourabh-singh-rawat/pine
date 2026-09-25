import type { Attachment, AttachmentVersion, NewAttachment, NewAttachmentVersion } from "@/db";
import type { AttachmentSecurityStatus, AttachmentStatus } from "@/features/attachment/constants";

export type AttachmentRepositoryOptions = { tx?: unknown };

export type UpdateAttachmentStatusInput = {
  status?: AttachmentStatus;
  securityStatus?: AttachmentSecurityStatus;
};

export interface IAttachmentRepository {
  save: (entity: NewAttachment, options?: AttachmentRepositoryOptions) => Promise<Attachment>;
  saveVersion: (
    entity: NewAttachmentVersion,
    options?: AttachmentRepositoryOptions,
  ) => Promise<AttachmentVersion>;
  findById: (id: string, options?: AttachmentRepositoryOptions) => Promise<Attachment | null>;
  findVersionById: (
    attachmentId: string,
    versionId: string,
    options?: AttachmentRepositoryOptions,
  ) => Promise<AttachmentVersion | null>;
  updateStatus: (
    id: string,
    input: UpdateAttachmentStatusInput,
    options?: AttachmentRepositoryOptions,
  ) => Promise<Attachment | null>;
  updateVersionStorageKey: (
    versionId: string,
    storageObjectKey: string,
    options?: AttachmentRepositoryOptions,
  ) => Promise<AttachmentVersion | null>;
  deleteById: (id: string, options?: AttachmentRepositoryOptions) => Promise<void>;
}
