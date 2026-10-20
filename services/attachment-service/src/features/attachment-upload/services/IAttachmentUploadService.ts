import type { AttachmentScopeType } from "@/features/attachment/constants";
import type { UploadTarget } from "@/integrations/storage";

export type CreateAttachmentUploadInput = {
  scopeType: AttachmentScopeType;
  scopeId: string;
  createdBy: string;
  filename: string;
  contentType: string;
  size: number;
  operationId?: string;
  metadata?: Record<string, unknown>;
};

export type UploadToTargetInput = {
  uploadId: string;
  data: Buffer | Uint8Array;
  contentType?: string;
};

export interface IAttachmentUploadService {
  createUploadTarget: (input: CreateAttachmentUploadInput) => Promise<UploadTarget>;
  uploadToTarget: (input: UploadToTargetInput) => Promise<void>;
}
