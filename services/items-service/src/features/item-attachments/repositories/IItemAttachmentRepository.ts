import type { DbClient, ItemAttachment } from "@/db";

export type ItemAttachmentRepositoryOptions = { tx?: DbClient };

export type CreateItemAttachmentEntity = {
  id?: string;
  itemId: string;
  attachmentId?: string | null;
  status: string;
  name: string;
  originalName: string;
  mimeType: string;
  size?: number | null;
  createdById: string;
};

export type UpdateItemAttachmentEntity = Partial<
  Pick<ItemAttachment, "attachmentId" | "status" | "name" | "originalName" | "mimeType" | "size">
>;

export interface IItemAttachmentRepository {
  save: (
    entity: CreateItemAttachmentEntity,
    options?: ItemAttachmentRepositoryOptions,
  ) => Promise<ItemAttachment>;
  update: (
    id: string,
    entity: UpdateItemAttachmentEntity,
    options?: ItemAttachmentRepositoryOptions,
  ) => Promise<ItemAttachment | null>;
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
  failStaleBefore: (
    olderThan: Date,
    limit: number,
    options?: ItemAttachmentRepositoryOptions,
  ) => Promise<number>;
}
