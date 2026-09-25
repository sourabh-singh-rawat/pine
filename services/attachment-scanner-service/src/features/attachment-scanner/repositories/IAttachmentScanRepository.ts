import type { AttachmentScan, AttachmentScanResult, DbClient } from "@/db";
import type { AttachmentScanStatus, AttachmentScanType } from "@/constants";

export type AttachmentScanRepositoryOptions = {
  tx?: DbClient;
};

export type CreateAttachmentScanEntity = {
  id: string;
  attachmentId: string;
  versionId: string;
  scopeType?: string;
  scopeId?: string;
  tenantId?: string;
  type: AttachmentScanType;
  status: AttachmentScanStatus;
  storageProvider?: string;
  storageObjectKey?: string;
};

export type UpdateAttachmentScanResultInput = {
  status: AttachmentScanStatus;
  scanner?: string;
  durationMs?: number;
  result?: AttachmentScanResult;
  metadata?: Record<string, unknown>;
};

export interface IAttachmentScanRepository {
  save: (
    entity: CreateAttachmentScanEntity,
    options?: AttachmentScanRepositoryOptions,
  ) => Promise<AttachmentScan>;
  findById: (
    id: string,
    options?: AttachmentScanRepositoryOptions,
  ) => Promise<AttachmentScan | null>;
  findByAttachmentAndVersion: (
    attachmentId: string,
    versionId: string,
    type?: AttachmentScanType,
    options?: AttachmentScanRepositoryOptions,
  ) => Promise<AttachmentScan | null>;
  updateResult: (
    id: string,
    input: UpdateAttachmentScanResultInput,
    options?: AttachmentScanRepositoryOptions,
  ) => Promise<AttachmentScan | null>;
  updateStatus: (
    id: string,
    status: AttachmentScanStatus,
    options?: AttachmentScanRepositoryOptions,
  ) => Promise<AttachmentScan | null>;
}
