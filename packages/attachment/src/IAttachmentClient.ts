import type { Readable } from "node:stream";
import type { CreateUploadTargetInput, CreateUploadTargetResponse } from "./schemas";

export interface CreateUploadTargetOptions {
  input: CreateUploadTargetInput;
  identityId: string;
  authMethod?: "access_token" | "session";
}

export interface DownloadAttachmentOptions {
  attachmentId: string;
  versionId: string;
}

export interface IAttachmentClient {
  createUploadTarget: (options: CreateUploadTargetOptions) => Promise<CreateUploadTargetResponse>;
  downloadStream: (options: DownloadAttachmentOptions) => Promise<Readable>;
}
