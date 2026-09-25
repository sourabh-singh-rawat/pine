import type { ItemAttachment } from "@/db";

export type CreateItemAttachmentOptions = {
  itemId: string;
  attachmentId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size?: number | null;
  identityId: string;
};

export type ListItemAttachmentsOptions = {
  itemId: string;
  identityId: string;
};

export type DeleteItemAttachmentOptions = {
  id: string;
  identityId: string;
};

export type CreateItemAttachmentUploadRequestOptions = {
  itemId: string;
  filename: string;
  contentType: string;
  size: number;
  identityId: string;
  authMethod?: "access_token" | "session";
};

export type CreateItemAttachmentUploadRequestResult = {
  uploadRequestId: string;
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
};

export type CompleteItemAttachmentUploadOptions = {
  uploadRequestId: string;
  attachmentId: string;
};

export interface IItemAttachmentService {
  create: (options: CreateItemAttachmentOptions) => Promise<ItemAttachment>;
  list: (options: ListItemAttachmentsOptions) => Promise<ItemAttachment[]>;
  delete: (options: DeleteItemAttachmentOptions) => Promise<void>;
  createUploadRequest: (
    options: CreateItemAttachmentUploadRequestOptions,
  ) => Promise<CreateItemAttachmentUploadRequestResult>;
  completeUpload: (options: CompleteItemAttachmentUploadOptions) => Promise<ItemAttachment | null>;
}
