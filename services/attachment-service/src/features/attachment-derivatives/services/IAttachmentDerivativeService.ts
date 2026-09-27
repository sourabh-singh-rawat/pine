import type { Readable } from "node:stream";
import type { AttachmentDerivative, DbClient } from "@/db";

export type StoreAttachmentDerivativeInput = {
  attachmentId: string;
  versionId: string;
  derivativeType: "thumbnail" | "preview";
  data: Buffer;
  contentType: string;
  width?: number;
  height?: number;
  tx?: DbClient;
};

export type GetAttachmentDerivativeContentInput = {
  attachmentId: string;
  derivativeType: "thumbnail" | "preview";
};

export type AttachmentDerivativeContent = {
  stream: Readable;
  filename: string;
  contentType: string;
  fileSize: number;
};

export interface IAttachmentDerivativeService {
  store: (input: StoreAttachmentDerivativeInput) => Promise<AttachmentDerivative>;
  getContent: (input: GetAttachmentDerivativeContentInput) => Promise<AttachmentDerivativeContent>;
}
