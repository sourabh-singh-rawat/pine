import type { Readable } from "node:stream";
import type { Attachment, DbClient } from "@/db";
import type { AttachmentScopeType } from "@/features/attachment/constants";

export type CreateAttachmentFromUploadInput = {
  scopeType: AttachmentScopeType;
  scopeId: string;
  tenantId?: string;
  filename: string;
  contentType: string;
  data: Buffer | Uint8Array;
  storageProvider: string;
  storageObjectKey: string;
  operationId?: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
  tx?: DbClient;
};

export type DeleteAttachmentOptions = {
  id: string;
  tx?: DbClient;
};

export type GetAttachmentVersionContentInput = {
  attachmentId: string;
  versionId: string;
};

export type AttachmentVersionContent = {
  stream: Readable;
  filename: string;
  contentType: string;
  fileSize: number;
};

export type UpdateSecurityStatusInput = {
  id: string;
  status: string;
  tx?: DbClient;
};

export interface IAttachmentService {
  createFromUpload: (input: CreateAttachmentFromUploadInput) => Promise<Attachment>;
  delete: (options: DeleteAttachmentOptions) => Promise<void>;
  getContent: (input: GetAttachmentVersionContentInput) => Promise<AttachmentVersionContent>;
  updateSecurityStatus: (input: UpdateSecurityStatusInput) => Promise<Attachment | null>;
}
