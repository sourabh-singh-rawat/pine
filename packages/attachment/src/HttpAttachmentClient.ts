import { Readable } from "node:stream";
import Value from "typebox/value";
import type {
  CreateUploadTargetOptions,
  DownloadAttachmentOptions,
  IAttachmentClient,
  StoreDerivativeOptions,
  StoreDerivativeResult,
  StoreMetadataOptions,
  UpdateSecurityStatusOptions,
} from "./IAttachmentClient";
import {
  CreateUploadTargetResponseSchema,
  type CreateUploadTargetResponse,
  StoreAttachmentMetadataResultSchema,
  type StoreAttachmentMetadataResult,
  StoreDerivativeResultSchema,
  UpdateSecurityStatusResultSchema,
  type UpdateSecurityStatusResult,
} from "./schemas";

export interface HttpAttachmentClientOptions {
  baseUrl: string;
}

export class HttpAttachmentClient implements IAttachmentClient {
  private readonly baseUrl: string;

  constructor(options: HttpAttachmentClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  async createUploadTarget(
    options: CreateUploadTargetOptions,
  ): Promise<CreateUploadTargetResponse> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-identity-id": options.identityId,
      "x-identity-auth-method": options.authMethod ?? "session",
    };

    const response = await fetch(`${this.baseUrl}/internal/attachments/createUploadTarget`, {
      method: "POST",
      headers,
      body: JSON.stringify(options.input),
    });

    if (!response.ok) {
      throw new Error(
        `/internal/attachments/createUploadTarget failed with status ${response.status}`,
      );
    }

    const body: unknown = await response.json();
    if (!Value.Check(CreateUploadTargetResponseSchema, body)) {
      throw new Error("createUploadTarget returned an invalid response body");
    }

    return body;
  }

  async downloadStream(options: DownloadAttachmentOptions): Promise<Readable> {
    const url = `${this.baseUrl}/internal/attachments/${options.attachmentId}/versions/${options.versionId}/content`;

    const response = await fetch(url);
    const body = response.body;

    if (!response.ok || !body) {
      throw new Error(`Failed to download attachment: ${response.statusText}`);
    }

    return Readable.from(body);
  }

  async storeDerivative(options: StoreDerivativeOptions): Promise<StoreDerivativeResult> {
    const url = `${this.baseUrl}/internal/attachments/${options.attachmentId}/versions/${options.versionId}/derivatives/${options.derivativeType}`;

    const headers: Record<string, string> = {
      "content-type": options.contentType,
      ...(options.width !== undefined ? { "x-image-width": options.width.toString() } : {}),
      ...(options.height !== undefined ? { "x-image-height": options.height.toString() } : {}),
    };

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: new Uint8Array(options.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to store derivative: ${response.statusText}`);
    }

    const body: unknown = await response.json();
    if (!Value.Check(StoreDerivativeResultSchema, body)) {
      throw new Error("storeDerivative returned an invalid response body");
    }

    return body;
  }

  async storeMetadata(options: StoreMetadataOptions): Promise<StoreAttachmentMetadataResult> {
    const url = `${this.baseUrl}/internal/attachments/${options.attachmentId}/versions/${options.versionId}/metadata`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options.metadata),
    });

    if (!response.ok) {
      throw new Error(
        `/internal/attachments/${options.attachmentId}/versions/${options.versionId}/metadata failed with status ${response.status}`,
      );
    }

    const body: unknown = await response.json();
    if (!Value.Check(StoreAttachmentMetadataResultSchema, body)) {
      throw new Error("storeMetadata returned an invalid response body");
    }

    return body;
  }

  async updateSecurityStatus(
    options: UpdateSecurityStatusOptions,
  ): Promise<UpdateSecurityStatusResult> {
    const url = `${this.baseUrl}/internal/attachments/${options.attachmentId}/security-status`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: options.status }),
    });

    if (!response.ok) {
      throw new Error(
        `/internal/attachments/${options.attachmentId}/security-status failed with status ${response.status}`,
      );
    }

    const body: unknown = await response.json();
    if (!Value.Check(UpdateSecurityStatusResultSchema, body)) {
      throw new Error("updateSecurityStatus returned an invalid response body");
    }

    return body;
  }
}
