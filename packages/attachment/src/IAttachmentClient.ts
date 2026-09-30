import type { Readable } from "node:stream";
import type {
  CreateUploadTargetInput,
  CreateUploadTargetResponse,
  StoreAttachmentMetadataBody,
  StoreAttachmentMetadataResult,
  UpdateSecurityStatusBody,
  UpdateSecurityStatusResult,
} from "./schemas";

export interface CreateUploadTargetOptions {
  input: CreateUploadTargetInput;
  identityId: string;
  authMethod?: "access_token" | "session";
}

export interface DownloadAttachmentOptions {
  attachmentId: string;
  versionId: string;
}

export interface StoreDerivativeOptions {
  attachmentId: string;
  versionId: string;
  derivativeType: "thumbnail" | "preview";
  data: Buffer;
  contentType: string;
  width?: number;
  height?: number;
}

export interface StoreDerivativeResult {
  derivativeId: string;
  attachmentId: string;
  versionId: string;
  derivativeType: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
}

export interface UpdateSecurityStatusOptions {
  attachmentId: string;
  status: UpdateSecurityStatusBody["status"];
}

export interface StoreMetadataOptions {
  attachmentId: string;
  versionId: string;
  metadata: StoreAttachmentMetadataBody;
}

export interface IAttachmentClient {
  createUploadTarget: (options: CreateUploadTargetOptions) => Promise<CreateUploadTargetResponse>;
  downloadStream: (options: DownloadAttachmentOptions) => Promise<Readable>;
  storeDerivative: (options: StoreDerivativeOptions) => Promise<StoreDerivativeResult>;
  storeMetadata: (options: StoreMetadataOptions) => Promise<StoreAttachmentMetadataResult>;
  updateSecurityStatus: (
    options: UpdateSecurityStatusOptions,
  ) => Promise<UpdateSecurityStatusResult>;
}
