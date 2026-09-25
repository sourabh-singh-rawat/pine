import type { DbClient, ItemAttachmentUploadRequest } from "@/db";

export type ItemAttachmentUploadRequestRepositoryOptions = { tx?: DbClient };

export type CreateItemAttachmentUploadRequestEntity = {
  itemId: string;
  status: string;
  name: string;
  originalName: string;
  mimeType: string;
  size?: number | null;
  createdById: string;
  attachmentId?: string | null;
};

export interface IItemAttachmentUploadRequestRepository {
  save: (
    entity: CreateItemAttachmentUploadRequestEntity,
    options?: ItemAttachmentUploadRequestRepositoryOptions,
  ) => Promise<ItemAttachmentUploadRequest>;
  findById: (
    id: string,
    options?: ItemAttachmentUploadRequestRepositoryOptions,
  ) => Promise<ItemAttachmentUploadRequest | null>;
  update: (
    id: string,
    entity: Partial<Pick<ItemAttachmentUploadRequest, "status" | "attachmentId" | "completedAt">>,
    options?: ItemAttachmentUploadRequestRepositoryOptions,
  ) => Promise<ItemAttachmentUploadRequest>;
}
