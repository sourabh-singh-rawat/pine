import type { DbClient, ItemAttachment } from "@/db";

export type ItemAttachmentRepositoryOptions = { tx?: DbClient };

export type CreateItemAttachmentEntity = {
  id?: string;
  itemId: string;
  attachmentId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size?: number | null;
  createdById: string;
};

export interface IItemAttachmentRepository {
  save: (
    entity: CreateItemAttachmentEntity,
    options?: ItemAttachmentRepositoryOptions,
  ) => Promise<ItemAttachment>;
  findById: (
    id: string,
    options?: ItemAttachmentRepositoryOptions,
  ) => Promise<ItemAttachment | null>;
  findByItemId: (
    itemId: string,
    options?: ItemAttachmentRepositoryOptions,
  ) => Promise<ItemAttachment[]>;
  findByItemAndAttachment: (
    itemId: string,
    attachmentId: string,
    options?: ItemAttachmentRepositoryOptions,
  ) => Promise<ItemAttachment | null>;
  softDelete: (id: string, options?: ItemAttachmentRepositoryOptions) => Promise<boolean>;
}
